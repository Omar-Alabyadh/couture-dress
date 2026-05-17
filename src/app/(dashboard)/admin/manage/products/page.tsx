"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
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
} from "@/components/admin/AdminPrimitives";
import { MediaPicker, MediaPickerButton } from "@/components/admin/media/MediaPicker";

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
};

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
    pushToast("نُقل المنتج إلى الأرشيف.", "success");
    await load();
  }

  return (
    <div dir="rtl" style={{ maxWidth: 960 }}>
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
          <AdminTable style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th aria-label="معاينة">صورة</th>
                <th>العنوان</th>
                <th>تصنيف</th>
                <th>مقاسات</th>
                <th>السعر</th>
                <th>ألوان</th>
                <th>نشر</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const thumb = primaryProductThumbSrc(p);
                return (
                <tr key={p.id}>
                  <td style={{ width: 56, verticalAlign: "middle" }}>
                    <AdminProductThumbCell src={thumb} />
                  </td>
                  <td>{p.titleAr}</td>
                  <td>{cats.find((c) => c.v === p.category)?.l ?? p.category}</td>
                  <td style={{ fontSize: 12 }}>
                    {p.variants?.length
                      ? p.variants.map((v) => v.size).join("، ")
                      : p.sizes.join("، ")}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {p.price != null && p.price !== ""
                      ? `${p.price} ${p.currency || "LYD"}`
                      : "—"}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {p.colors.map((c) => c.label).join("، ")}
                  </td>
                  <td>{p.isPublished ? "نعم" : "لا"}</td>
                  <td>
                    <AdminButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditing(p);
                        setCreating(false);
                      }}
                    >
                      تعديل
                    </AdminButton>{" "}
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={() => void confirmSoftDelete(p)}
                    >
                      حذف
                    </AdminButton>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminCard>
    </div>
  );
}

type LocalImageRow = {
  key: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

type VariantFormRow = {
  key: string;
  size: string;
  colorId: string;
  quantity: string;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
};

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

function AdminProductMediaCard({
  row,
  index,
  total,
  urlError,
  primaryRadioName,
  onUrlChange,
  onAltChange,
  onSetPrimary,
  onRemove,
  onMoveUp,
  onMoveDown,
  disableRemove,
}: {
  row: LocalImageRow;
  index: number;
  total: number;
  urlError?: string;
  primaryRadioName: string;
  onUrlChange: (v: string) => void;
  onAltChange: (v: string) => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableRemove: boolean;
}) {
  const url = row.url.trim();
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const loadFailed = Boolean(url && failedForUrl === url);
  const unsafe = url.length > 0 && !isSafeProductImageUrl(url);
  const inlineUrlMsg =
    urlError ??
    (unsafe ? "الرابط يجب أن يبدأ بـ https:// أو http:// أو / (مسار عام فقط)." : undefined);

  return (
    <div
      className={`admin-media-card${row.isPrimary ? " admin-media-card--primary" : ""}`}
    >
      {row.isPrimary ? (
        <span className="admin-media-card__badge">صورة أساسية</span>
      ) : null}
      <div className="admin-media-card__preview">
        {url.length === 0 ? (
          <span className="admin-media-card__preview-placeholder">
            معاينة الصورة — أضيفي رابطًا صالحًا
          </span>
        ) : null}
        {url.length > 0 && unsafe ? (
          <span className="admin-media-card__preview-error">
            لا يمكن عرض معاينة — رابط غير مسموح
          </span>
        ) : null}
        {url.length > 0 && !unsafe ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin media preview */}
            <img
              src={url}
              alt={row.alt.trim() || "معاينة"}
              onError={() => setFailedForUrl(url)}
              style={{ visibility: loadFailed ? "hidden" : "visible" }}
            />
            {loadFailed ? (
              <span className="admin-media-card__preview-error">
                تعذر تحميل الصورة. تحققي من الرابط أو الصلاحيات.
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="admin-media-card__toolbar">
        <span className="admin-media-card__order">
          الترتيب {index + 1} / {total}
        </span>
        <AdminButton
          type="button"
          variant="ghost"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label="نقل الصورة لأعلى"
        >
          ↑
        </AdminButton>
        <AdminButton
          type="button"
          variant="ghost"
          disabled={index >= total - 1}
          onClick={onMoveDown}
          aria-label="نقل الصورة لأسفل"
        >
          ↓
        </AdminButton>
      </div>

      <label style={{ margin: 0 }}>
        رابط الصورة
        <input
          value={row.url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://… أو /assets/…"
          dir="ltr"
          style={{ textAlign: "left" }}
        />
      </label>
      <MediaPickerButton
        label="اختر من مكتبة الوسائط"
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

      <label style={{ margin: 0 }}>
        وصف بديل (alt) اختياري
        <input
          value={row.alt}
          onChange={(e) => onAltChange(e.target.value)}
        />
      </label>

      <label
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          margin: 0,
        }}
      >
        <input
          type="radio"
          name={primaryRadioName}
          checked={row.isPrimary}
          onChange={onSetPrimary}
        />
        تعيين كصورة أساسية
      </label>

      <AdminButton
        type="button"
        variant="ghost"
        onClick={onRemove}
        disabled={disableRemove}
      >
        إزالة
      </AdminButton>
    </div>
  );
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
  const formDomId = useId();
  const primaryRadioName = `primary-image-${formDomId.replace(/:/g, "")}`;
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
  const [libraryPickerRowKey, setLibraryPickerRowKey] = useState<string | null>(
    null,
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

  const primaryRow =
    imageRows.find((r) => r.isPrimary) ?? imageRows[0] ?? null;
  const primaryEmptyButOthersFilled = Boolean(
    primaryRow &&
      !primaryRow.url.trim() &&
      imageRows.some((r) => r.url.trim().length > 0),
  );
  const allImageUrlsEmpty = imageRows.every((r) => !r.url.trim());

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
        isAvailable: row.isAvailable,
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
      }
      await onSaved();
    } catch {
      pushToast("تعذر الاتصال بالخادم أثناء الحفظ.", "error");
    } finally {
      setLoading(false);
    }
  };

  function setPrimaryKey(key: string) {
    setImageRows((rows) =>
      rows.map((r) => ({ ...r, isPrimary: r.key === key })),
    );
  }

  function moveImageRow(key: string, dir: -1 | 1) {
    setImageRows((rows) => {
      const i = rows.findIndex((r) => r.key === key);
      if (i < 0) return rows;
      const j = i + dir;
      if (j < 0 || j >= rows.length) return rows;
      const next = [...rows];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      return next;
    });
  }

  function addImageRow() {
    setImageRows((rows) => [
      ...rows,
      { key: newKey(), url: "", alt: "", isPrimary: false },
    ]);
  }

  function addImageFromLibrary() {
    const key = newKey();
    setImageRows((rows) => {
      const hasAnyUrl = rows.some((r) => r.url.trim().length > 0);
      return [
        ...rows,
        {
          key,
          url: "",
          alt: "",
          isPrimary: !hasAnyUrl && rows.length === 0,
        },
      ];
    });
    setLibraryPickerRowKey(key);
  }

  function applyLibrarySelection(
    rowKey: string,
    asset: { url: string; alt: string | null },
  ) {
    setMediaPanelError(null);
    setImageRows((rows) => {
      const hasOtherUrls = rows.some(
        (r) => r.key !== rowKey && r.url.trim().length > 0,
      );
      return rows.map((r) => {
        if (r.key === rowKey) {
          return {
            ...r,
            url: asset.url,
            alt: r.alt.trim() || (asset.alt?.trim() ?? ""),
            isPrimary: !hasOtherUrls,
          };
        }
        if (!hasOtherUrls) {
          return { ...r, isPrimary: false };
        }
        return r;
      });
    });
  }

  function removeImageRow(key: string) {
    setImageRows((rows) => {
      if (rows.length <= 1) return rows;
      const next = rows.filter((r) => r.key !== key);
      if (!next.some((r) => r.isPrimary)) {
        next[0] = { ...next[0]!, isPrimary: true };
      }
      return next;
    });
  }

  function addVariantRow() {
    setVariantRows((rows) => [
      ...rows,
      {
        key: newVariantKey(),
        size: "",
        colorId: "",
        quantity: "1",
        isAvailable: true,
        allowSpecialOrder: false,
      },
    ]);
  }

  function removeVariantRow(key: string) {
    setVariantRows((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.key !== key);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="admin-form admin-form--wide"
      style={{ margin: "0.5rem 0 1.2rem" }}
    >
      <h3>{initial ? "تعديل" : "جديد"}</h3>
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

      <section className="admin-media-panel" aria-labelledby="product-media-heading">
        <h4 id="product-media-heading" className="admin-media-panel__title">
          صور المنتج
        </h4>
        <div className="admin-media-panel__guidance">
          <strong>إرشادات التصوير للملابس</strong>
          <ul>
            <li>النسبة المثالية: 4:5 (عرض × ارتفاع)</li>
            <li>أفضل مقاس: 1200×1500 بكسل — الحد الأدنى: 800×1000</li>
            <li>الصور العمودية أوضح لعرض القصّة والتفاصيل</li>
            <li>استخدمي إضاءة موحدة وخلفية هادئة</li>
            <li>تجنّبي الصور الأفقية الواسعة ولقطات الشاشة قدر الإمكان</li>
          </ul>
        </div>

        {mediaPanelError ? (
          <p className="admin-media-panel__error" role="alert">
            {mediaPanelError}
          </p>
        ) : null}

        {allImageUrlsEmpty ? (
          <p className="admin-media-panel__empty">
            أضيفي صورة واحدة على الأقل للمنتج — الصق روابط الصور (أو مسارات
            عامة مثل /assets/…) في البطاقات أدناه.
          </p>
        ) : null}

        {primaryEmptyButOthersFilled ? (
          <p className="admin-hint" style={{ margin: "0 0 12px" }}>
            الصورة المحددة كأساسية بلا رابط؛ عند الحفظ ستُعتمد أول صورة صالحة
            تلقائيًا كأساسية، أو عيّني أساسية لصف يحتوي رابطًا.
          </p>
        ) : null}

        <div className="admin-media-grid">
          {imageRows.map((row, index) => (
            <AdminProductMediaCard
              key={row.key}
              row={row}
              index={index}
              total={imageRows.length}
              urlError={mediaUrlErrors[row.key]}
              primaryRadioName={primaryRadioName}
              onUrlChange={(v) => {
                setMediaPanelError(null);
                setMediaUrlErrors((m) => {
                  if (!m[row.key]) return m;
                  const next = { ...m };
                  delete next[row.key];
                  return next;
                });
                setImageRows((rows) =>
                  rows.map((r) => (r.key === row.key ? { ...r, url: v } : r)),
                );
              }}
              onAltChange={(v) =>
                setImageRows((rows) =>
                  rows.map((r) => (r.key === row.key ? { ...r, alt: v } : r)),
                )
              }
              onSetPrimary={() => setPrimaryKey(row.key)}
              onRemove={() => removeImageRow(row.key)}
              onMoveUp={() => moveImageRow(row.key, -1)}
              onMoveDown={() => moveImageRow(row.key, 1)}
              disableRemove={imageRows.length <= 1}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <AdminButton type="button" variant="primary" onClick={addImageRow}>
            + إضافة صورة
          </AdminButton>
          <AdminButton type="button" variant="secondary" onClick={addImageFromLibrary}>
            إضافة صورة من المكتبة
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
              applyLibrarySelection(libraryPickerRowKey, asset);
              setLibraryPickerRowKey(null);
            }}
          />
        ) : null}
      </section>

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

      <div
        style={{
          marginTop: 14,
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(185,133,111,0.35)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8, color: "#d7c9c2" }}>
          المقاسات والتوفر
        </div>
        <p className="admin-hint" style={{ marginTop: 0 }}>
          الكمية 0 أو إلغاء «متاح» يظهر المقاس للزبائن كغير متوفر. «طلب خاص»
          يسمح برسالة واتساب لطلب غير متوفر.
        </p>
        {variantRows.map((row) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gap: 8,
              marginBottom: 10,
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <label style={{ margin: 0 }}>
              المقاس
              <input
                value={row.size}
                onChange={(e) => {
                  const v = e.target.value;
                  setVariantRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, size: v } : r,
                    ),
                  );
                }}
                required
              />
            </label>
            <label style={{ margin: 0 }}>
              الكمية
              <input
                type="number"
                min={0}
                value={row.quantity}
                onChange={(e) => {
                  const v = e.target.value;
                  setVariantRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, quantity: v } : r,
                    ),
                  );
                }}
              />
            </label>
            <label style={{ margin: 0 }}>
              لون (اختياري)
              <select
                value={row.colorId}
                onChange={(e) => {
                  const v = e.target.value;
                  setVariantRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, colorId: v } : r,
                    ),
                  );
                }}
              >
                <option value="">— بدون —</option>
                {colors.map((c) => {
                  const archived = Boolean(c.deletedAt);
                  if (archived && row.colorId !== c.id) return null;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {archived ? " (مؤرشف)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                checked={row.isAvailable}
                onChange={(e) => {
                  const v = e.target.checked;
                  setVariantRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, isAvailable: v } : r,
                    ),
                  );
                }}
              />
              متاح للبيع
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                checked={row.allowSpecialOrder}
                onChange={(e) => {
                  const v = e.target.checked;
                  setVariantRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, allowSpecialOrder: v } : r,
                    ),
                  );
                }}
              />
              طلب خاص عبر واتساب عند عدم التوفر
            </label>
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() => removeVariantRow(row.key)}
              disabled={variantRows.length <= 1}
            >
              حذف الصف
            </AdminButton>
          </div>
        ))}
        <AdminButton type="button" variant="secondary" onClick={addVariantRow}>
          + صف مقاس
        </AdminButton>
      </div>

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
      <p>
        <AdminButton type="submit" variant="primary" disabled={loading}>
          {loading ? "…" : "حفظ"}
        </AdminButton>{" "}
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </AdminButton>
      </p>
    </form>
  );
}
