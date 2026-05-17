"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSafeProductImageUrl } from "@/lib/validation/product-input";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminSectionHeader,
  AdminSelect,
  AdminTable,
  AdminTd,
} from "@/components/admin/AdminPrimitives";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { ProductStatusBadge } from "@/components/admin/ProductStatusBadge";
import {
  ProductGalleryEditor,
  type LocalImageRow,
} from "@/components/admin/products/ProductGalleryEditor";
import {
  ProductVariantEditor,
  type VariantFormRow,
} from "@/components/admin/products/ProductVariantEditor";
import {
  deriveProductAdminStatus,
  type ProductAdminStatus,
} from "@/lib/admin/product-status";
import {
  normalizeSearch,
  paginateList,
  sortByDateString,
  type SortDirection,
} from "@/lib/admin/list-client";

type ColorRow = { id: string; label: string; deletedAt: string | null };
type BrandRow = {
  id: string;
  nameAr: string;
  type: string;
  deletedAt: string | null;
  isPublished: boolean;
};
type ProductImageRow = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};
type ProductVariantRow = {
  id: string;
  size: string;
  colorId: string | null;
  quantity: number;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
  sortOrder: number;
};
type Product = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  imageUrl: string;
  price: string | null;
  currency: string;
  category: string;
  isPublished: boolean;
  deletedAt: string | null;
  sizes: string[];
  brandDesignerId: string | null;
  brandDesigner: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    type: string;
    deletedAt: string | null;
  } | null;
  colors: { id: string; label: string; deletedAt?: string | null }[];
  images: ProductImageRow[];
  variants: ProductVariantRow[];
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 12;
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "OUT_OF_STOCK", label: "غير متوفر" },
  { value: "ARCHIVED", label: "مؤرشف" },
];

const cats = [
  { v: "dresses", l: "فساتين" },
  { v: "abayas", l: "عبايات" },
  { v: "casual", l: "كاجوال" },
  { v: "accessories", l: "إكسسوارات" },
];

function primaryProductThumbSrc(p: Product): string {
  const sorted = [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const primary = sorted.find((i) => i.isPrimary) ?? sorted[0];
  const u = primary?.url?.trim();
  if (u) return u;
  return p.imageUrl?.trim() ?? "";
}

function AdminProductThumbCell({ src }: { src: string }) {
  const trimmed = src.trim();
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = Boolean(trimmed && failedFor === trimmed);
  if (!trimmed || failed) {
    return (
      <div className="admin-table-thumb admin-table-thumb--empty">—</div>
    );
  }
  return (
    <div className="admin-table-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin list thumbnail */}
      <img
        src={trimmed}
        alt=""
        loading="lazy"
        onError={() => setFailedFor(trimmed)}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Product[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortDirection>("newest");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [p, c, b] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/colors", { cache: "no-store" }),
        fetch("/api/admin/brands", { cache: "no-store" }),
      ]);
      if (!p.ok) {
        const msg =
          (await readApiErrorMessage(p)) ?? fallbackErrorMessage(p);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await p.json()) as { data: Product[] };
        setList(j.data);
      }
      if (c.ok) {
        const j2 = (await c.json()) as { data: ColorRow[] };
        setColors(j2.data);
      }
      if (b.ok) {
        const j3 = (await b.json()) as { data: BrandRow[] };
        setBrands(j3.data);
      }
    } catch {
      setLoadError("تعذر الاتصال بالخادم.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);

  async function confirmSoftDelete(product: Product) {
    const ok = await requestConfirm({
      title: "حذف ناعم للمنتج",
      message: `سيتم أرشفة «${product.titleAr}». يمكنك استرجاعه لاحقًا من الأرشيف.`,
      confirmLabel: "نعم، أرشِفي",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تمت أرشفة المنتج ويمكن استرجاعه من الأرشيف.", "success");
    await load();
  }

  const filteredList = useMemo(() => {
    const q = normalizeSearch(search);
    let rows = [...list];
    if (q) {
      rows = rows.filter(
        (p) =>
          p.titleAr.toLowerCase().includes(q) ||
          (p.titleEn?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (statusFilter !== "all") {
      rows = rows.filter(
        (p) =>
          deriveProductAdminStatus({
            isPublished: p.isPublished,
            deletedAt: p.deletedAt,
            variants: p.variants,
            sizes: p.sizes,
          }) === statusFilter,
      );
    }
    rows = sortByDateString(rows, sort);
    return rows;
  }, [list, search, statusFilter, sort]);

  const paginated = useMemo(
    () => paginateList(filteredList, page, PAGE_SIZE),
    [filteredList, page],
  );

  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="المنتجات"
          description='الحذف من هنا تمويه (soft) — تسترجعينه من "الأرشيف". حقل sizes القديم يُحدَّث تلقائيًا من «المقاسات والتوفر».'
          actions={
            <AdminButton
              type="button"
              variant="primary"
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
            >
              + منتج جديد
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? (
          <AdminLoadingState />
        ) : null}

        {creating && (
          <ProductForm
            key="create-product"
            colors={colors}
            brands={brands}
            onClose={() => setCreating(false)}
            onSaved={async () => {
              setCreating(false);
              pushToast("تم إنشاء المنتج.", "success");
              await load();
            }}
          />
        )}
        {editing && (
          <ProductForm
            key={editing.id}
            initial={editing}
            colors={colors}
            brands={brands}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              pushToast("تم تحديث المنتج.", "success");
              await load();
            }}
          />
        )}

        {!loading && !loadError && list.length === 0 ? (
          <AdminEmptyState
            title="لا توجد منتجات بعد"
            description='اضغطي "منتج جديد" لإضافة أول قطعة.'
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <>
            <AdminListToolbar
              searchValue={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="بحث بالعنوان أو الوصف…"
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              page={paginated.page}
              totalPages={paginated.totalPages}
              total={paginated.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              statusOptions={STATUS_FILTER_OPTIONS}
            />
          <AdminTable style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th aria-label="معاينة">صورة</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>تصنيف</th>
                <th>مقاسات</th>
                <th>السعر</th>
                <th>ألوان</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {paginated.items.map((p) => {
                const status = deriveProductAdminStatus({
                  isPublished: p.isPublished,
                  deletedAt: p.deletedAt,
                  variants: p.variants,
                  sizes: p.sizes,
                });
                const thumb = primaryProductThumbSrc(p);
                return (
                <tr key={p.id}>
                  <AdminTd label="">
                    <AdminProductThumbCell src={thumb} />
                  </AdminTd>
                  <AdminTd label="العنوان">{p.titleAr}</AdminTd>
                  <AdminTd label="الحالة">
                    <ProductStatusBadge status={status} />
                  </AdminTd>
                  <AdminTd label="تصنيف">
                    {cats.find((c) => c.v === p.category)?.l ?? p.category}
                  </AdminTd>
                  <AdminTd label="مقاسات" style={{ fontSize: 12 }}>
                    {p.variants?.length
                      ? p.variants.map((v) => v.size).join("، ")
                      : p.sizes.join("، ")}
                  </AdminTd>
                  <AdminTd label="السعر" style={{ fontSize: 12 }}>
                    {p.price != null && p.price !== ""
                      ? `${p.price} ${p.currency || "LYD"}`
                      : "—"}
                  </AdminTd>
                  <AdminTd label="ألوان" style={{ fontSize: 12 }}>
                    {p.colors.map((c) => c.label).join("، ")}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <div className="admin-table__actions">
                      <AdminButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditing(p);
                          setCreating(false);
                        }}
                      >
                        تعديل
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="danger"
                        onClick={() => void confirmSoftDelete(p)}
                      >
                        حذف
                      </AdminButton>
                    </div>
                  </AdminTd>
                </tr>
              );
              })}
            </tbody>
          </AdminTable>
          </>
        ) : null}
      </AdminCard>
    </div>
  );
}

function newKey() {
  return `img-${Math.random().toString(36).slice(2, 11)}`;
}

function newVariantKey() {
  return `var-${Math.random().toString(36).slice(2, 11)}`;
}

function initialImageRows(initial?: Product): LocalImageRow[] {
  if (initial?.images?.length) {
    return [...initial.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((im) => ({
        key: im.id,
        url: im.url,
        alt: im.alt ?? "",
        isPrimary: im.isPrimary,
      }));
  }
  const legacy = initial?.imageUrl?.trim() ?? "";
  return [
    {
      key: newKey(),
      url: legacy,
      alt: "",
      isPrimary: true,
    },
  ];
}

function initialVariantRows(initial?: Product): VariantFormRow[] {
  if (initial?.variants && initial.variants.length > 0) {
    return initial.variants.map((v) => ({
      key: v.id,
      size: v.size,
      colorId: v.colorId ?? "",
      quantity: String(v.quantity),
      isAvailable: v.isAvailable,
      allowSpecialOrder: v.allowSpecialOrder,
    }));
  }
  const sz = initial?.sizes ?? [];
  if (sz.length > 0) {
    return sz.map((s, i) => ({
      key: `leg-${i}-${s}`,
      size: s,
      colorId: "",
      quantity: "1",
      isAvailable: true,
      allowSpecialOrder: false,
    }));
  }
  return [
    {
      key: newVariantKey(),
      size: "",
      colorId: "",
      quantity: "1",
      isAvailable: true,
      allowSpecialOrder: false,
    },
  ];
}

function ProductForm({
  initial,
  colors,
  brands,
  onClose,
  onSaved,
}: {
  initial?: Product;
  colors: ColorRow[];
  brands: BrandRow[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "dresses");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>(() =>
    initialVariantRows(initial),
  );
  const [colorIds, setColorIds] = useState<Set<string>>(
    new Set((initial?.colors ?? []).map((c) => c.id)),
  );
  const [price, setPrice] = useState(initial?.price ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "LYD");
  const [brandDesignerId, setBrandDesignerId] = useState(
    initial?.brandDesignerId ?? "",
  );
  const [imageRows, setImageRows] = useState<LocalImageRow[]>(() =>
    initialImageRows(initial),
  );
  const [loading, setLoading] = useState(false);
  const [mediaPanelError, setMediaPanelError] = useState<string | null>(null);
  const [mediaUrlErrors, setMediaUrlErrors] = useState<Record<string, string>>(
    () => ({}),
  );
  const brandSelectOptions = useMemo(() => {
    const active = brands.filter((b) => !b.deletedAt && b.isPublished);
    const curId = initial?.brandDesignerId;
    if (curId) {
      const cur = brands.find((b) => b.id === curId);
      if (cur && !active.some((b) => b.id === cur.id)) {
        return [cur, ...active];
      }
    }
    return active;
  }, [brands, initial?.brandDesignerId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMediaPanelError(null);
    const cleaned = imageRows
      .map((r) => ({
        ...r,
        url: r.url.trim(),
        alt: r.alt.trim(),
      }))
      .filter((r) => r.url.length > 0);
    if (cleaned.length === 0) {
      setMediaPanelError("أضيفي صورة واحدة على الأقل للمنتج");
      pushToast("أضيفي صورة واحدة على الأقل للمنتج.", "error");
      setLoading(false);
      return;
    }

    const nextUrlErrors: Record<string, string> = {};
    for (const row of cleaned) {
      if (!isSafeProductImageUrl(row.url)) {
        nextUrlErrors[row.key] =
          "رابط غير صالح — استخدمي https:// أو http:// أو مسارًا عامًا يبدأ بـ /";
      }
    }
    if (Object.keys(nextUrlErrors).length > 0) {
      setMediaUrlErrors(nextUrlErrors);
      pushToast("صححي روابط الصور غير الصالحة.", "error");
      setLoading(false);
      return;
    }

    const seen = new Map<string, string>();
    for (const row of cleaned) {
      const norm = row.url.trim().toLowerCase();
      const existing = seen.get(norm);
      if (existing) {
        setMediaUrlErrors({
          [existing]: "نفس الرابط مستخدم أكثر من مرة",
          [row.key]: "نفس الرابط مستخدم أكثر من مرة",
        });
        pushToast("يوجد رابط صورة مكرر في القائمة.", "error");
        setLoading(false);
        return;
      }
      seen.set(norm, row.key);
    }
    setMediaUrlErrors({});
    const variantsPayload: {
      size: string;
      colorId: string | null;
      quantity: number;
      isAvailable: boolean;
      allowSpecialOrder: boolean;
    }[] = [];
    for (const row of variantRows) {
      const sz = row.size.trim();
      if (!sz) {
        pushToast("كل صف يجب أن يحتوي مقاسًا.", "error");
        setLoading(false);
        return;
      }
      const q = parseInt(row.quantity.trim(), 10);
      if (!Number.isFinite(q) || q < 0 || q > 999999) {
        pushToast("الكمية يجب أن تكون رقمًا صحيحًا ≥ 0.", "error");
        setLoading(false);
        return;
      }
      variantsPayload.push({
        size: sz,
        colorId: row.colorId.trim() ? row.colorId.trim() : null,
        quantity: q,
        isAvailable: q > 0 && row.isAvailable,
        allowSpecialOrder: row.allowSpecialOrder,
      });
    }
    const keys = new Set<string>();
    for (const v of variantsPayload) {
      const k = `${v.size.toLowerCase()}__${v.colorId ?? ""}`;
      if (keys.has(k)) {
        pushToast("لا تكرّري نفس المقاس مع نفس اللون في صفين.", "error");
        setLoading(false);
        return;
      }
      keys.add(k);
    }
    const primary = cleaned.find((r) => r.isPrimary) ?? cleaned[0]!;
    const imagesPayload = cleaned.map((r, i) => ({
      url: r.url,
      alt: r.alt ? r.alt : null,
      isPrimary: r.key === primary.key,
      sortOrder: i,
    }));
    const body = {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim() || null,
      description: description.trim() || null,
      imageUrl: primary.url,
      category,
      isPublished,
      colorIds: Array.from(colorIds),
      brandDesignerId:
        brandDesignerId.trim() === "" ? null : brandDesignerId.trim(),
      price: price.trim() === "" ? null : price.trim(),
      currency: currency.trim() || "LYD",
      images: imagesPayload,
      variants: variantsPayload,
    };
    try {
      if (initial) {
        const r = await fetch(`/api/admin/products/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
          pushToast(msg, "error");
          return;
        }
        pushToast("تم حفظ المنتج بنجاح.", "success");
      } else {
        const r = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
          pushToast(msg, "error");
          return;
        }
        pushToast("تم إنشاء المنتج بنجاح.", "success");
      }
      await onSaved();
    } catch {
      pushToast("تعذر الاتصال بالخادم أثناء الحفظ.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formStatus = deriveProductAdminStatus({
    isPublished,
    variants: variantRows.map((r) => ({
      isAvailable: r.isAvailable,
      quantity: parseInt(r.quantity, 10) || 0,
    })),
    sizes: [],
  });

  return (
    <form
      onSubmit={submit}
      className="admin-form admin-form--wide"
      style={{ margin: "0.5rem 0 1.2rem" }}
    >
      <div className="admin-form__title-row">
        <h3>{initial ? "تعديل" : "جديد"}</h3>
        <ProductStatusBadge status={formStatus} />
      </div>
      <label>
        العنوان (عربي)
        <input
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          required
        />
      </label>
      <label>
        عنوان EN (اختياري)
        <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
      </label>
      <label>
        وصف
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label>
        ماركة / مصمم (اختياري)
        <AdminSelect
          value={brandDesignerId}
          onChange={(e) => setBrandDesignerId(e.target.value)}
        >
          <option value="">— بدون —</option>
          {brandSelectOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.type === "DESIGNER" ? "مصمم — " : "ماركة — "}
              {b.nameAr}
            </option>
          ))}
        </AdminSelect>
      </label>

      <ProductGalleryEditor
        rows={imageRows}
        urlErrors={mediaUrlErrors}
        panelError={mediaPanelError}
        onRowsChange={setImageRows}
        onUrlErrorsChange={setMediaUrlErrors}
        onPanelErrorChange={setMediaPanelError}
      />

      <label>
        السعر (اختياري — رقم موجب)
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="مثال: 250"
        />
      </label>
      <label>
        العملة (افتراضي LYD)
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </label>

      <label>
        التصنيف
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {cats.map((c) => (
            <option key={c.v} value={c.v}>
              {c.l}
            </option>
          ))}
        </select>
      </label>

      <ProductVariantEditor rows={variantRows} colors={colors} onChange={setVariantRows} />

      <div>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#d7c9c2" }}>
          ألوان المنتج (فلاتر)
        </div>
        {colors.map((c) => {
          const isArchived = Boolean(c.deletedAt);
          if (isArchived && !colorIds.has(c.id) && !initial) return null;
          return (
            <label
              key={c.id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <input
                type="checkbox"
                checked={colorIds.has(c.id)}
                onChange={() => {
                  setColorIds((s) => {
                    const n = new Set(s);
                    if (n.has(c.id)) n.delete(c.id);
                    else n.add(c.id);
                    return n;
                  });
                }}
              />
              {c.label}
              {isArchived ? " (مؤرشف لون)" : null}
            </label>
          );
        })}
      </div>
      <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        منشور
      </label>
      <p className="admin-product-form-actions">
        <AdminButton type="submit" variant="primary" disabled={loading}>
          {loading ? "…" : "حفظ"}
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </AdminButton>
      </p>
    </form>
  );
}
