"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { normalizeSearch } from "@/lib/admin/list-client";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminInput,
  AdminLoadingState,
  AdminSectionHeader,
  AdminButton,
  AdminLuxurySelect,
} from "@/components/admin/AdminPrimitives";
import { formatProductPriceDisplay } from "@/lib/product-price";
import {
  clampDiscountPercent,
  resolveProductDiscount,
} from "@/lib/products/discount";

type DiscountRow = {
  id: string;
  titleAr: string;
  category: string;
  imageUrl: string;
  price: string | null;
  currency: string;
  discountPercent: number;
  discountActive: boolean;
  finalPrice: string | null;
  hasDiscount: boolean;
};

type DraftState = { percent: string; active: boolean };

const STATIC_CATEGORY_LABELS: Record<string, string> = {
  dresses: "فساتين",
  abayas: "عبايات",
  casual: "كاجوال",
  accessories: "إكسسوارات",
  suits: "بدلات",
};

function DiscountThumb({ src, alt }: { src: string; alt: string }) {
  const trimmed = src.trim();
  const [failed, setFailed] = useState(false);
  if (!trimmed || failed) {
    return <div className="admin-discount-card__thumb admin-discount-card__thumb--empty">—</div>;
  }
  return (
    <div className="admin-discount-card__thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin discount thumbnail */}
      <img src={trimmed} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

function DiscountCard({
  row,
  categoryLabel,
  draft,
  onDraftChange,
  onSave,
  onRemove,
  saving,
}: {
  row: DiscountRow;
  categoryLabel: string;
  draft: DraftState;
  onDraftChange: (next: DraftState) => void;
  onSave: () => void;
  onRemove: () => void;
  saving: boolean;
}) {
  const percentNum = clampDiscountPercent(Number(draft.percent) || 0);
  const preview = resolveProductDiscount({
    price: row.price,
    discountPercent: percentNum,
    discountActive: draft.active,
  });
  const hasPrice = row.price != null && row.price !== "";
  const inputId = `discount-${row.id}`;
  const toggleId = `discount-active-${row.id}`;

  return (
    <article className="admin-discount-card">
      <div className="admin-discount-card__head">
        <DiscountThumb src={row.imageUrl} alt={row.titleAr} />
        <div className="admin-discount-card__title-wrap">
          <h3 className="admin-discount-card__title">{row.titleAr}</h3>
          <span className="admin-discount-card__category">{categoryLabel}</span>
          {row.hasDiscount ? (
            <span className="admin-discount-card__state admin-discount-card__state--on">
              <span className="admin-discount-card__state-icon" aria-hidden>
                ✓
              </span>
              الخصم مفعل
            </span>
          ) : (
            <span className="admin-discount-card__state admin-discount-card__state--off">
              الخصم غير مفعل
            </span>
          )}
        </div>
      </div>

      <div className="admin-discount-card__pricing">
        <span className="admin-discount-card__price-label">السعر الحالي</span>
        <span className="admin-discount-card__price">
          {hasPrice
            ? formatProductPriceDisplay(row.price, row.currency)
            : "غير محدد"}
        </span>
      </div>

      <div className="admin-discount-card__edit-row">
        <label
          className="admin-toggle admin-discount-card__toggle"
          htmlFor={toggleId}
        >
          <input
            id={toggleId}
            type="checkbox"
            className="admin-toggle__input"
            checked={draft.active}
            disabled={!hasPrice}
            onChange={(e) =>
              onDraftChange({ ...draft, active: e.target.checked })
            }
          />
          <span className="admin-toggle__track" aria-hidden="true">
            <span className="admin-toggle__thumb" />
          </span>
          <span className="admin-toggle__label">تفعيل الخصم</span>
        </label>

        <label className="admin-field admin-discount-card__field" htmlFor={inputId}>
          <span className="admin-field__label">نسبة الخصم</span>
          <div className="admin-discount-card__percent-wrap">
            <AdminInput
              id={inputId}
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              className="admin-discount-card__percent-input"
              value={draft.percent}
              disabled={!hasPrice}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onDraftChange({ ...draft, percent: "" });
                  return;
                }
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                onDraftChange({
                  ...draft,
                  percent: String(clampDiscountPercent(n)),
                });
              }}
              placeholder="0"
              aria-describedby={`${inputId}-hint`}
            />
            <span className="admin-discount-card__percent-suffix" aria-hidden>
              %
            </span>
          </div>
          <span id={`${inputId}-hint`} className="admin-hint admin-discount-card__percent-hint">
            {percentNum > 0 ? `خصم ${percentNum}%` : "قيمة من 0 إلى 100"}
          </span>
        </label>
      </div>

      <div
        className={`admin-discount-card__preview${
          preview.hasDiscount ? " admin-discount-card__preview--on" : ""
        }`}
        aria-live="polite"
      >
        {!hasPrice ? (
          <span className="admin-hint">أضف سعرًا للمنتج أولًا لتفعيل الخصم.</span>
        ) : preview.hasDiscount ? (
          <>
            <span className="admin-discount-card__preview-old">
              {formatProductPriceDisplay(preview.originalPrice, row.currency)}
            </span>
            <span className="admin-discount-card__preview-new">
              {formatProductPriceDisplay(preview.finalPrice, row.currency)}
            </span>
            <span className="admin-discount-card__preview-badge">
              خصم {preview.percent}%
            </span>
          </>
        ) : (
          <span className="admin-hint">السعر بدون خصم</span>
        )}
      </div>

      <div
        className={`admin-discount-card__actions${
          row.hasDiscount ? "" : " admin-discount-card__actions--solo"
        }`}
      >
        <AdminButton
          type="button"
          variant="primary"
          disabled={saving || !hasPrice}
          onClick={onSave}
        >
          {saving ? "جارٍ الحفظ…" : "حفظ"}
        </AdminButton>
        {row.hasDiscount ? (
          <AdminButton
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onRemove}
          >
            إزالة الخصم
          </AdminButton>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminDiscountsPage() {
  const { pushToast } = useAdminToast();
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    STATIC_CATEGORY_LABELS,
  );

  const draftsFromRows = useCallback((list: DiscountRow[]) => {
    const next: Record<string, DraftState> = {};
    for (const r of list) {
      next[r.id] = {
        percent: r.discountPercent ? String(r.discountPercent) : "",
        active: r.discountActive,
      };
    }
    return next;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [d, cat] = await Promise.all([
        adminFetch("/api/admin/discounts", { cache: "no-store" }),
        adminFetch("/api/admin/categories", { cache: "no-store" }),
      ]);
      if (!d.ok) {
        const msg = (await readApiErrorMessage(d)) ?? fallbackErrorMessage(d);
        setLoadError(msg);
        setRows([]);
        return;
      }
      const j = (await d.json()) as { data: DiscountRow[] };
      setRows(j.data);
      setDrafts(draftsFromRows(j.data));
      if (cat.ok) {
        const jc = (await cat.json()) as {
          data: { slug: string; nameAr: string; deletedAt: string | null }[];
        };
        const map: Record<string, string> = { ...STATIC_CATEGORY_LABELS };
        for (const c of jc.data) {
          if (!c.deletedAt) map[c.slug] = c.nameAr;
        }
        setCategoryLabels(map);
      }
    } catch {
      setLoadError("تعذر الاتصال بالخادم.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [draftsFromRows]);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);

  const categoryOptions = useMemo(() => {
    const present = new Set(rows.map((r) => r.category));
    const opts = [{ value: "all", label: "كل الأقسام" }];
    for (const slug of present) {
      opts.push({ value: slug, label: categoryLabels[slug] ?? slug });
    }
    return opts;
  }, [rows, categoryLabels]);

  const visibleRows = useMemo(() => {
    const q = normalizeSearch(search);
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (q && !r.titleAr.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, categoryFilter]);

  const persist = useCallback(
    async (row: DiscountRow, percent: number, active: boolean) => {
      setSavingId(row.id);
      try {
        const res = await adminFetch(`/api/admin/discounts/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discountPercent: percent, discountActive: active }),
        });
        if (!res.ok) {
          const msg = (await readApiErrorMessage(res)) ?? fallbackErrorMessage(res);
          pushToast(msg, "error");
          return;
        }
        const j = (await res.json()) as {
          data: { discountPercent: number; discountActive: boolean; hasDiscount: boolean; finalPrice: string | null };
        };
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  discountPercent: j.data.discountPercent,
                  discountActive: j.data.discountActive,
                  hasDiscount: j.data.hasDiscount,
                  finalPrice: j.data.finalPrice,
                }
              : r,
          ),
        );
        setDrafts((prev) => ({
          ...prev,
          [row.id]: {
            percent: j.data.discountPercent ? String(j.data.discountPercent) : "",
            active: j.data.discountActive,
          },
        }));
        pushToast(
          active && percent > 0 ? "تم تطبيق الخصم." : "تم تحديث الخصم.",
          "success",
        );
      } catch {
        pushToast("تعذر الاتصال بالخادم.", "error");
      } finally {
        setSavingId(null);
      }
    },
    [pushToast],
  );

  return (
    <div className="admin-page admin-page--catalog admin-page--discounts" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="الخصومات %"
          description="إدارة خصومات المنتجات المنشورة فقط — تظهر مباشرة في صفحة المنتجات."
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && rows.length === 0 && !loadError ? <AdminLoadingState /> : null}

        {!loadError && rows.length > 0 ? (
          <>
            <div className="admin-discounts-panel" dir="rtl">
              <div className="admin-discounts-toolbar">
                <label className="admin-field admin-discounts-toolbar__search">
                  <span className="admin-field__label">بحث</span>
                  <AdminInput
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث باسم المنتج…"
                    autoComplete="off"
                  />
                </label>
                <label className="admin-field admin-discounts-toolbar__filter">
                  <span className="admin-field__label">القسم</span>
                  <AdminLuxurySelect
                    id="discount-category-filter"
                    value={categoryFilter}
                    options={categoryOptions}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  />
                </label>
              </div>
              <p className="admin-discounts-toolbar__count" aria-live="polite">
                عدد المنتجات: {visibleRows.length}
              </p>
            </div>

            {visibleRows.length === 0 ? (
              <AdminEmptyState
                title="لا توجد نتائج"
                description="جرّب تعديل البحث أو الفلتر."
              />
            ) : (
              <div className="admin-discount-grid">
                {visibleRows.map((row) => {
                  const draft = drafts[row.id] ?? { percent: "", active: false };
                  return (
                    <DiscountCard
                      key={row.id}
                      row={row}
                      categoryLabel={categoryLabels[row.category] ?? row.category}
                      draft={draft}
                      saving={savingId === row.id}
                      onDraftChange={(next) =>
                        setDrafts((prev) => ({ ...prev, [row.id]: next }))
                      }
                      onSave={() =>
                        void persist(
                          row,
                          clampDiscountPercent(Number(draft.percent) || 0),
                          draft.active,
                        )
                      }
                      onRemove={() => void persist(row, 0, false)}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {!loading && !loadError && rows.length === 0 ? (
          <AdminEmptyState
            title="لا توجد منتجات منشورة"
            description="انشر منتجًا أولًا من صفحة المنتجات لتتمكن من تطبيق خصم عليه."
          />
        ) : null}
      </AdminCard>
    </div>
  );
}
