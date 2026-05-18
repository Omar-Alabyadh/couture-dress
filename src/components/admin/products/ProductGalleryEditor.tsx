"use client";

import { useCallback, useState } from "react";
import { isSafeProductImageUrl } from "@/lib/validation/product-input";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import { AdminButton } from "@/components/admin/AdminPrimitives";
import { MediaPicker, MediaPickerButton } from "@/components/admin/media/MediaPicker";
import { ImagePreviewModal } from "@/components/admin/products/ImagePreviewModal";

export type LocalImageRow = {
  key: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

type ProductGalleryEditorProps = {
  rows: LocalImageRow[];
  urlErrors: Record<string, string>;
  panelError: string | null;
  onRowsChange: (rows: LocalImageRow[]) => void;
  onUrlErrorsChange: (errors: Record<string, string>) => void;
  onPanelErrorChange: (msg: string | null) => void;
};

function reorderRows(rows: LocalImageRow[], from: number, to: number): LocalImageRow[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
    return rows;
  }
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return normalizeCover(next);
}

function normalizeCover(rows: LocalImageRow[]): LocalImageRow[] {
  if (rows.length === 0) return rows;
  const firstWithUrl = rows.findIndex((r) => r.url.trim().length > 0);
  const primaryIdx =
    rows.findIndex((r) => r.isPrimary && r.url.trim()) >= 0
      ? rows.findIndex((r) => r.isPrimary && r.url.trim())
      : firstWithUrl >= 0
        ? firstWithUrl
        : 0;
  return rows.map((r, i) => ({ ...r, isPrimary: i === primaryIdx }));
}

function GalleryCard({
  row,
  index,
  total,
  urlError,
  dragIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onUrlChange,
  onAltChange,
  onSetCover,
  onRemove,
  onPreview,
  onPickFromLibrary,
  disableRemove,
}: {
  row: LocalImageRow;
  index: number;
  total: number;
  urlError?: string;
  dragIndex: number | null;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onUrlChange: (v: string) => void;
  onAltChange: (v: string) => void;
  onSetCover: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onPickFromLibrary: () => void;
  disableRemove: boolean;
}) {
  const url = row.url.trim();
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const loadFailed = Boolean(url && failedForUrl === url);
  const unsafe = url.length > 0 && !isSafeProductImageUrl(url);
  const inlineUrlMsg =
    urlError ??
    (unsafe ? "الرابط يجب أن يبدأ بـ https:// أو http:// أو / (مسار عام فقط)." : undefined);
  const isCover = row.isPrimary || index === 0;

  return (
    <article
      className={`admin-gallery-card${isCover ? " admin-gallery-card--cover" : ""}${dragIndex === index ? " admin-gallery-card--dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="admin-gallery-card__badges">
        {isCover ? (
          <span className="admin-gallery-card__badge admin-gallery-card__badge--cover">
            غلاف
          </span>
        ) : null}
        {index === 0 ? (
          <span className="admin-gallery-card__badge">الأولى</span>
        ) : null}
        <span className="admin-gallery-card__order">
          {index + 1} / {total}
        </span>
      </div>

      <button
        type="button"
        className="admin-gallery-card__preview-btn"
        onClick={onPreview}
        disabled={!url || unsafe || loadFailed}
        aria-label="معاينة كاملة"
      >
        <div className="admin-media-card__preview">
          {url.length === 0 ? (
            <span className="admin-media-card__preview-placeholder">
              اسحب لإعادة الترتيب — أضف رابطًا
            </span>
          ) : null}
          {url.length > 0 && unsafe ? (
            <span className="admin-media-card__preview-error">رابط غير مسموح</span>
          ) : null}
          {url.length > 0 && !unsafe ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={row.alt.trim() || "معاينة"}
                onError={() => setFailedForUrl(url)}
                style={{ visibility: loadFailed ? "hidden" : "visible" }}
              />
              {loadFailed ? (
                <span className="admin-media-card__preview-error">
                  تعذر تحميل الصورة
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </button>

      <label className="admin-gallery-card__field">
        <span>رابط الصورة</span>
        <input
          className="admin-control"
          value={row.url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://… أو /assets/…"
          dir="ltr"
          style={{ textAlign: "left" }}
        />
      </label>
      <MediaPickerButton
        label="من المكتبة"
        variant="secondary"
        defaultUsageType="PRODUCT_IMAGE"
        defaultFolder="products"
        onSelect={(asset) => {
          onUrlChange(asset.url);
          if (!row.alt.trim() && asset.alt) onAltChange(asset.alt);
        }}
      />
      {inlineUrlMsg ? (
        <p className="admin-media-inline-error">{inlineUrlMsg}</p>
      ) : null}

      <label className="admin-gallery-card__field">
        <span>وصف بديل (alt)</span>
        <input
          className="admin-control"
          value={row.alt}
          onChange={(e) => onAltChange(e.target.value)}
        />
      </label>

      <div className="admin-gallery-card__actions">
        {!isCover ? (
          <AdminButton type="button" variant="secondary" onClick={onSetCover}>
            تعيين غلاف
          </AdminButton>
        ) : null}
        <AdminButton
          type="button"
          variant="ghost"
          onClick={onRemove}
          disabled={disableRemove}
        >
          إزالة
        </AdminButton>
      </div>
    </article>
  );
}

export function ProductGalleryEditor({
  rows,
  urlErrors,
  panelError,
  onRowsChange,
  onUrlErrorsChange,
  onPanelErrorChange,
}: ProductGalleryEditorProps) {
  const { requestConfirm } = useAdminConfirm();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [libraryPickerRowKey, setLibraryPickerRowKey] = useState<string | null>(
    null,
  );

  const setRows = useCallback(
    (updater: (prev: LocalImageRow[]) => LocalImageRow[]) => {
      onRowsChange(normalizeCover(updater(rows)));
    },
    [onRowsChange, rows],
  );

  function moveToCover(key: string) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key);
      if (i <= 0) return prev.map((r, idx) => ({ ...r, isPrimary: idx === 0 }));
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.unshift(item!);
      return next.map((r, idx) => ({ ...r, isPrimary: idx === 0 }));
    });
  }

  async function confirmRemove(key: string) {
    const ok = await requestConfirm({
      title: "إزالة الصورة",
      message: "هل تريد إزالة هذه الصورة من المعرض؟",
      confirmLabel: "إزالة",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.key !== key);
    });
  }

  const allEmpty = rows.every((r) => !r.url.trim());

  return (
    <section className="admin-media-panel" aria-labelledby="product-gallery-title">
      <h4 id="product-gallery-title" className="admin-media-panel__title">
        معرض الصور
      </h4>
      <p className="admin-hint">
        اسحب البطاقات لإعادة الترتيب. الصورة الأولى / «غلاف» تظهر في بطاقة المنتج.
      </p>

      {panelError ? (
        <p className="admin-media-panel__error" role="alert">
          {panelError}
        </p>
      ) : null}

      {allEmpty ? (
        <p className="admin-media-panel__empty">أضف صورة واحدة على الأقل.</p>
      ) : null}

      <div className="admin-gallery-grid">
        {rows.map((row, index) => (
          <GalleryCard
            key={row.key}
            row={row}
            index={index}
            total={rows.length}
            urlError={urlErrors[row.key]}
            dragIndex={dragIndex}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex == null) return;
              setRows((prev) => reorderRows(prev, dragIndex, index));
              setDragIndex(null);
            }}
            onUrlChange={(v) => {
              onPanelErrorChange(null);
              onUrlErrorsChange(
                Object.fromEntries(
                  Object.entries(urlErrors).filter(([k]) => k !== row.key),
                ),
              );
              setRows((prev) =>
                prev.map((r) => (r.key === row.key ? { ...r, url: v } : r)),
              );
            }}
            onAltChange={(v) =>
              setRows((prev) =>
                prev.map((r) => (r.key === row.key ? { ...r, alt: v } : r)),
              )
            }
            onSetCover={() => moveToCover(row.key)}
            onRemove={() => void confirmRemove(row.key)}
            onPreview={() => {
              const u = row.url.trim();
              if (u) setPreview({ src: u, alt: row.alt.trim() || "معاينة" });
            }}
            onPickFromLibrary={() => setLibraryPickerRowKey(row.key)}
            disableRemove={rows.length <= 1}
          />
        ))}
      </div>

      <div className="admin-product-form-actions" style={{ marginTop: 8 }}>
        <AdminButton
          type="button"
          variant="primary"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                key: `img-${Math.random().toString(36).slice(2, 11)}`,
                url: "",
                alt: "",
                isPrimary: false,
              },
            ])
          }
        >
          + إضافة صورة
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => {
            const key = `img-${Math.random().toString(36).slice(2, 11)}`;
            setRows((prev) => [
              ...prev,
              {
                key,
                url: "",
                alt: "",
                isPrimary: prev.length === 0,
              },
            ]);
            setLibraryPickerRowKey(key);
          }}
        >
          إضافة من المكتبة
        </AdminButton>
      </div>

      {libraryPickerRowKey ? (
        <MediaPicker
          open
          onClose={() => setLibraryPickerRowKey(null)}
          title="صورة منتج من المكتبة"
          defaultUsageType="PRODUCT_IMAGE"
          defaultFolder="products"
          onSelect={(asset) => {
            const key = libraryPickerRowKey;
            setRows((prev) =>
              prev.map((r) =>
                r.key === key
                  ? {
                      ...r,
                      url: asset.url,
                      alt: r.alt.trim() || (asset.alt?.trim() ?? ""),
                    }
                  : r,
              ),
            );
            setLibraryPickerRowKey(null);
          }}
        />
      ) : null}

      <ImagePreviewModal
        open={Boolean(preview)}
        src={preview?.src ?? ""}
        alt={preview?.alt ?? ""}
        onClose={() => setPreview(null)}
      />
    </section>
  );
}
