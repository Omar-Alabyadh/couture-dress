"use client";

import { useCallback, useEffect, useState } from "react";
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
  AdminTable,
} from "@/components/admin/AdminPrimitives";

type ColorRow = { id: string; label: string; deletedAt: string | null };
type ProductImageRow = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
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
  colors: { id: string; label: string; deletedAt?: string | null }[];
  images: ProductImageRow[];
};

const cats = [
  { v: "dresses", l: "فساتين" },
  { v: "abayas", l: "عبايات" },
  { v: "casual", l: "كاجوال" },
  { v: "accessories", l: "إكسسوارات" },
];

export default function AdminProductsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Product[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [p, c] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/colors", { cache: "no-store" }),
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
          description='الحذف من هنا تمويه (soft) — تسترجعينه من "الأرشيف".'
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
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.titleAr}</td>
                  <td>{cats.find((c) => c.v === p.category)?.l ?? p.category}</td>
                  <td style={{ fontSize: 12 }}>{p.sizes.join("، ")}</td>
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
              ))}
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

function newKey() {
  return `img-${Math.random().toString(36).slice(2, 11)}`;
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
  return [
    {
      key: newKey(),
      url: initial?.imageUrl ?? "/assets/p1.jpg",
      alt: "",
      isPrimary: true,
    },
  ];
}

function ProductForm({
  initial,
  colors,
  onClose,
  onSaved,
}: {
  initial?: Product;
  colors: ColorRow[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "dresses");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [sizes, setSizes] = useState((initial?.sizes ?? []).join(", "));
  const [colorIds, setColorIds] = useState<Set<string>>(
    new Set((initial?.colors ?? []).map((c) => c.id)),
  );
  const [price, setPrice] = useState(initial?.price ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "LYD");
  const [imageRows, setImageRows] = useState<LocalImageRow[]>(() =>
    initialImageRows(initial),
  );
  const [loading, setLoading] = useState(false);

  const primaryRow =
    imageRows.find((r) => r.isPrimary) ?? imageRows[0] ?? null;
  const previewUrl = primaryRow?.url?.trim() || "/assets/p1.jpg";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sizeList = sizes
      .split(/،|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const cleaned = imageRows
      .map((r) => ({
        ...r,
        url: r.url.trim(),
        alt: r.alt.trim(),
      }))
      .filter((r) => r.url.length > 0);
    if (cleaned.length === 0) {
      pushToast("أضيفي رابط صورة واحد على الأقل.", "error");
      setLoading(false);
      return;
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
      sizes: sizeList,
      colorIds: Array.from(colorIds),
      price: price.trim() === "" ? null : price.trim(),
      currency: currency.trim() || "LYD",
      images: imagesPayload,
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

  function addImageRow() {
    setImageRows((rows) => [
      ...rows,
      { key: newKey(), url: "", alt: "", isPrimary: false },
    ]);
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

  return (
    <form
      onSubmit={submit}
      className="admin-form"
      style={{ margin: "0.5rem 0 1.2rem", maxWidth: 560 }}
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

      <div
        className="admin-hint"
        style={{
          margin: "12px 0",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(185,133,111,0.35)",
          lineHeight: 1.55,
        }}
      >
        <strong>معيار الصور الموصى به</strong>
        <ul style={{ margin: "8px 0 0", paddingInlineStart: "1.1rem" }}>
          <li>النسبة: 4:5 (عرض : ارتفاع)</li>
          <li>الأفضل: 1200×1500 بكسل</li>
          <li>الحد الأدنى الموصى به: 800×1000</li>
          <li>الصيغة المفضّلة: WebP — يُقبل أيضًا JPG/PNG</li>
          <li>لصور الهاتف: قصّي المنتج بوضوح قبل النشر</li>
        </ul>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "0 0 auto" }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: "#d7c9c2" }}>
            معاينة 4:5 (الصورة الأساسية)
          </div>
          <div
            style={{
              width: 140,
              aspectRatio: "4 / 5",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(185,133,111,0.4)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img
              src={previewUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(ev) => {
                ev.currentTarget.style.opacity = "0.35";
              }}
            />
          </div>
        </div>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: "#d7c9c2" }}>
            صور المنتج (روابط)
          </div>
          {imageRows.map((row) => (
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
                رابط الصورة
                <input
                  value={row.url}
                  onChange={(e) => {
                    const v = e.target.value;
                    setImageRows((rows) =>
                      rows.map((r) =>
                        r.key === row.key ? { ...r, url: v } : r,
                      ),
                    );
                  }}
                  placeholder="https://… أو /assets/…"
                  required={row.isPrimary}
                />
              </label>
              <label style={{ margin: 0 }}>
                وصف بديل (alt) اختياري
                <input
                  value={row.alt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setImageRows((rows) =>
                      rows.map((r) =>
                        r.key === row.key ? { ...r, alt: v } : r,
                      ),
                    );
                  }}
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
                  name="primary-image"
                  checked={row.isPrimary}
                  onChange={() => setPrimaryKey(row.key)}
                />
                صورة أساسية (تظهر أولًا في المتجر)
              </label>
              <button
                type="button"
                onClick={() => removeImageRow(row.key)}
                disabled={imageRows.length <= 1}
              >
                حذف هذه الصورة
              </button>
            </div>
          ))}
          <AdminButton type="button" variant="primary" onClick={addImageRow}>
            + إضافة صورة
          </AdminButton>
        </div>
      </div>

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
      <label>
        المقاسات (مفصولة بفاصلة)
        <input
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          placeholder="M, L, XL"
        />
      </label>
      <div>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#d7c9c2" }}>
          الألوان
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
