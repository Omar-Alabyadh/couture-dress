"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

type ColorRow = { id: string; label: string; deletedAt: string | null };
type Product = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  imageUrl: string;
  category: string;
  isPublished: boolean;
  sizes: string[];
  colors: { id: string; label: string; deletedAt?: string | null }[];
};

const cats = [
  { v: "dresses", l: "فساتين" },
  { v: "abayas", l: "عبايات" },
  { v: "casual", l: "كاجوال" },
  { v: "accessories", l: "إكسسوارات" },
];

export default function AdminProductsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setMsg(null);
    const [p, c] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/colors", { cache: "no-store" }),
    ]);
    if (p.ok) {
      const j = (await p.json()) as { data: Product[] };
      setList(j.data);
    }
    if (c.ok) {
      const j2 = (await c.json()) as { data: ColorRow[] };
      setColors(j2.data);
    }
  }, []);
  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);
  return (
    <div dir="rtl" style={{ maxWidth: 960 }}>
      <h1 style={{ margin: "0 0 0.3rem" }}>المنتجات</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        الحذف من هنا تمويه (soft) — تسترجعينه من &quot;الأرشيف&quot;.
      </p>
      {msg ? <p style={{ color: "#8c8" }}>{msg}</p> : null}
      <p>
        <button
          type="button"
          className="login-btn"
          style={{ width: "auto", display: "inline-block" }}
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          + منتج جديد
        </button>
      </p>
      {creating && (
        <ProductForm
          colors={colors}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            setMsg("تم الحفظ");
            await load();
          }}
        />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          colors={colors}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setMsg("تم التحديث");
            await load();
          }}
        />
      )}
      <table className="admin-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>العنوان</th>
            <th>تصنيف</th>
            <th>مقاسات</th>
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
                {p.colors.map((c) => c.label).join("، ")}
              </td>
              <td>{p.isPublished ? "نعم" : "لا"}</td>
              <td>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p);
                    setCreating(false);
                  }}
                >
                  تعديل
                </button>{" "}
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("حذف الناعم؟")) return;
                    const r = await fetch(`/api/admin/products/${p.id}`, {
                      method: "DELETE",
                    });
                    if (r.ok) {
                      setMsg("نُقل للأرشيف");
                      await load();
                    }
                  }}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "/assets/p1.jpg");
  const [category, setCategory] = useState(initial?.category ?? "dresses");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [sizes, setSizes] = useState((initial?.sizes ?? []).join(", "));
  const [colorIds, setColorIds] = useState<Set<string>>(
    new Set((initial?.colors ?? []).map((c) => c.id)),
  );
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sizeList = sizes
      .split(/،|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const body = {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim() || null,
      description: description.trim() || null,
      imageUrl: imageUrl.trim(),
      category,
      isPublished,
      sizes: sizeList,
      colorIds: Array.from(colorIds),
    };
    try {
      if (initial) {
        const r = await fetch(`/api/admin/products/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error("bad");
      } else {
        const r = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error("bad");
      }
      await onSaved();
    } catch {
      alert("فشل الحفظ");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="admin-form"
      style={{ margin: "0.5rem 0 1.2rem", maxWidth: 480 }}
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
        رابط الصورة
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
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
        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#d7c9c2" }}>الألوان</div>
        {colors.map((c) => {
            const isArchived = Boolean(c.deletedAt);
            if (isArchived && !colorIds.has(c.id) && !initial) return null;
            return (
            <label key={c.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
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
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "…" : "حفظ"}
        </button>{" "}
        <button type="button" onClick={onClose}>
          إلغاء
        </button>
      </p>
    </form>
  );
}
