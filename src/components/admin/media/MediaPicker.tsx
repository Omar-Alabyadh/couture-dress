"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MediaUsageType } from "@/generated/prisma/client";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminInput,
  AdminLoadingState,
  AdminSelect,
} from "@/components/admin/AdminPrimitives";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import {
  MEDIA_FOLDER_OPTIONS,
  MEDIA_USAGE_OPTIONS,
  buildMediaListQuery,
  createPickerFilters,
  formatMediaBytes,
  formatMediaDimensions,
  toMediaPickerSelection,
  usageTypeLabel,
  type MediaPickerSelection,
  type MediaUIFilters,
} from "@/lib/admin/media-ui";
import type { MediaAssetDto, MediaListResult } from "@/lib/media/types";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

const SEARCH_DEBOUNCE_MS = 300;
const PICKER_EMPTY_MSG =
  "لا توجد وسائط بعد. ارفعي صورة من مكتبة الوسائط أولًا.";

export type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaPickerSelection) => void;
  title?: string;
  defaultUsageType?: MediaUsageType;
  defaultFolder?: string;
  /** Reserved for a future phase; single-select only. */
  multiSelect?: boolean;
};

export function MediaPicker({
  open,
  onClose,
  onSelect,
  title = "اختيار من مكتبة الوسائط",
  defaultUsageType,
  defaultFolder,
}: MediaPickerProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<MediaUIFilters>(() =>
    createPickerFilters(defaultUsageType, defaultFolder),
  );
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [items, setItems] = useState<MediaAssetDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedFilters(filters), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, open]);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const url = buildMediaListQuery(debouncedFilters, cursor ?? undefined);
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) {
          const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
          setError(msg);
          if (!append) setItems([]);
          setNextCursor(null);
          return;
        }
        const j = (await r.json()) as MediaListResult;
        setItems((prev) => (append ? [...prev, ...j.data] : j.data));
        setNextCursor(j.nextCursor);
        setError(null);
      } catch {
        setError("تعذر الاتصال بالخادم.");
        if (!append) {
          setItems([]);
          setNextCursor(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedFilters],
  );

  useEffect(() => {
    if (!open) return;
    return runAfterEffectFlush(() => {
      void fetchPage(null, false);
    });
  }, [open, fetchPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>("button[type='button']")?.focus();
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const selected = items.find((a) => a.id === selectedId) ?? null;

  const confirmSelect = () => {
    if (!selected) return;
    onSelect(toMediaPickerSelection(selected));
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="admin-modal-root admin-picker-root"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="admin-modal admin-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-picker-modal__header">
          <h2 id={titleId} className="admin-modal__title">
            {title}
          </h2>
          <Link
            href="/admin/manage/media"
            className="admin-picker-modal__library-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            رفع صورة جديدة ↗
          </Link>
        </header>

        <div className="admin-picker-filters">
          <AdminField label="نوع الاستخدام" htmlFor="picker-filter-usage">
            <AdminSelect
              id="picker-filter-usage"
              value={filters.usageType}
              disabled={loading && items.length === 0}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  usageType: e.target.value as MediaUsageType | "",
                })
              }
            >
              {MEDIA_USAGE_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="المجلد" htmlFor="picker-filter-folder">
            <AdminSelect
              id="picker-filter-folder"
              value={filters.folder}
              disabled={loading && items.length === 0}
              onChange={(e) =>
                setFilters({ ...filters, folder: e.target.value })
              }
            >
              {MEDIA_FOLDER_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="بحث" htmlFor="picker-filter-q">
            <AdminInput
              id="picker-filter-q"
              type="search"
              value={filters.q}
              disabled={loading && items.length === 0}
              placeholder="ابحثي…"
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </AdminField>
        </div>

        <div className="admin-picker-modal__body">
          {loading && items.length === 0 ? (
            <AdminLoadingState label="جارٍ تحميل الوسائط…" />
          ) : null}
          {error && items.length === 0 ? (
            <AdminErrorState
              message={error}
              onRetry={() => void fetchPage(null, false)}
            />
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <AdminEmptyState
              title="لا توجد وسائط"
              description={PICKER_EMPTY_MSG}
            />
          ) : null}
          {items.length > 0 ? (
            <ul className="admin-picker-grid" role="listbox" aria-label="الوسائط">
              {items.map((asset) => {
                const isSelected = selectedId === asset.id;
                return (
                  <li key={asset.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`admin-picker-item${isSelected ? " admin-picker-item--selected" : ""}`}
                      onClick={() => setSelectedId(asset.id)}
                      onDoubleClick={() => {
                        setSelectedId(asset.id);
                        onSelect(toMediaPickerSelection(asset));
                        onClose();
                      }}
                    >
                      <div className="admin-picker-item__preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.alt?.trim() || asset.filename}
                          loading="lazy"
                        />
                      </div>
                      <div className="admin-picker-item__meta">
                        <span className="admin-picker-item__name" title={asset.originalFilename}>
                          {asset.originalFilename}
                        </span>
                        <span className="admin-picker-item__facts">
                          {formatMediaDimensions(asset)} · {formatMediaBytes(asset.sizeBytes)} ·{" "}
                          {usageTypeLabel(asset.usageType)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {loadingMore ? <AdminLoadingState label="جارٍ تحميل المزيد…" /> : null}
          {nextCursor && !loadingMore ? (
            <div className="admin-picker-load-more">
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => void fetchPage(nextCursor, true)}
              >
                تحميل المزيد
              </AdminButton>
            </div>
          ) : null}
        </div>

        <footer className="admin-modal__actions admin-picker-modal__footer">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            disabled={!selected}
            onClick={confirmSelect}
          >
            اختيار
          </AdminButton>
        </footer>
      </div>
    </div>
  );
}

type MediaPickerButtonProps = {
  label: string;
  title?: string;
  defaultUsageType?: MediaUsageType;
  defaultFolder?: string;
  onSelect: (asset: MediaPickerSelection) => void;
  variant?: "secondary" | "ghost";
  className?: string;
  children?: ReactNode;
};

export function MediaPickerButton({
  label,
  title,
  defaultUsageType,
  defaultFolder,
  onSelect,
  variant = "secondary",
  className = "",
}: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminButton
        type="button"
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
      </AdminButton>
      {open ? (
        <MediaPicker
          open
          onClose={() => setOpen(false)}
          onSelect={(asset) => {
            onSelect(asset);
            setOpen(false);
          }}
          title={title}
          defaultUsageType={defaultUsageType}
          defaultFolder={defaultFolder}
        />
      ) : null}
    </>
  );
}
