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
  AdminField,
  AdminInput,
  AdminLoadingState,
  AdminSectionHeader,
  AdminTable,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";

type Testimonial = {
  id: string;
  customerName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  deletedAt: string | null;
};

export default function AdminTestimonialsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Testimonial[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/testimonials", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Testimonial[] };
        setList(j.data);
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

  async function restoreRow(t: Testimonial) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تم الاسترجاع.", "success");
    await load();
  }

  async function archiveRow(t: Testimonial) {
    const ok = await requestConfirm({
      title: "أرشفة الرأي",
      message: `هل تريدين أرشفة رأي «${t.customerName}»؟`,
      confirmLabel: "أرشِفي",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تمت الأرشفة.", "success");
    await load();
  }

  async function togglePublished(t: Testimonial) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !t.isPublished }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast(t.isPublished ? "أُخفيت عن العامة." : "أُعلنت للعامة.", "success");
    await load();
  }

  async function patchSortOrder(t: Testimonial, raw: string) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: Number(raw) }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تم حفظ الترتيب.", "success");
    await load();
  }

  return (
    <div dir="rtl" style={{ maxWidth: 880 }}>
      <AdminCard>
        <AdminSectionHeader
          title="آراء العملاء"
          description="تظهر المنشورة فقط في الصفحة الرئيسية — مرتبة حسب الترتيب ثم التاريخ."
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? (
          <AdminLoadingState />
        ) : null}

        <form
          className="admin-form"
          style={{ marginTop: 8 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch("/api/admin/testimonials", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerName: customerName.trim(),
                text: text.trim(),
                rating: Number(rating),
                imageUrl: imageUrl.trim() || null,
                sortOrder: Number(sortOrder),
              }),
            });
            if (!r.ok) {
              const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
              pushToast(msg, "error");
              return;
            }
            setCustomerName("");
            setText("");
            setRating("5");
            setImageUrl("");
            setSortOrder("0");
            pushToast("تمت الإضافة.", "success");
            await load();
          }}
        >
          <AdminField label="اسم العميلة" htmlFor="tm-name">
            <AdminInput
              id="tm-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </AdminField>
          <AdminField label="النص" htmlFor="tm-text">
            <AdminTextarea
              id="tm-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </AdminField>
          <AdminField label="التقييم (1–5)" htmlFor="tm-rating">
            <AdminInput
              id="tm-rating"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </AdminField>
          <AdminField label="رابط صورة (اختياري)" htmlFor="tm-img">
            <AdminInput
              id="tm-img"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              dir="ltr"
              placeholder="https://… أو /assets/…"
            />
          </AdminField>
          <MediaPickerButton
            label="اختر صورة من مكتبة الوسائط"
            defaultUsageType="TESTIMONIAL_AVATAR"
            defaultFolder="testimonials"
            onSelect={(asset) => setImageUrl(asset.url)}
          />
          <AdminField label="الترتيب" htmlFor="tm-sort">
            <AdminInput
              id="tm-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </AdminField>
          <AdminButton type="submit" variant="primary" style={{ width: 160 }}>
            إضافة
          </AdminButton>
        </form>

        {!loading && !loadError && list.filter((x) => !x.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد آراء بعد"
            description="أضيفي أول رأي باستخدام النموذج أعلاه."
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>العميلة</th>
                <th>مقتطف</th>
                <th>تقييم</th>
                <th>ترتيب</th>
                <th>نشر</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr
                  key={t.id}
                  style={{ opacity: t.deletedAt ? 0.45 : 1 }}
                >
                  <td>{t.customerName}</td>
                  <td style={{ fontSize: 12, maxWidth: 280 }}>
                    {t.text.length > 120 ? `${t.text.slice(0, 120)}…` : t.text}
                  </td>
                  <td>{t.rating}</td>
                  <td style={{ width: 120 }}>
                    {t.deletedAt ? (
                      t.sortOrder
                    ) : (
                      <AdminInput
                        type="number"
                        defaultValue={t.sortOrder}
                        key={`${t.id}-${t.sortOrder}`}
                        onBlur={(e) => {
                          if (e.target.value === String(t.sortOrder)) return;
                          void patchSortOrder(t, e.target.value);
                        }}
                        style={{ width: 88 }}
                      />
                    )}
                  </td>
                  <td>
                    {t.deletedAt ? (
                      "—"
                    ) : (
                      <AdminButton
                        type="button"
                        variant="ghost"
                        onClick={() => void togglePublished(t)}
                      >
                        {t.isPublished ? "إخفاء" : "نشر"}
                      </AdminButton>
                    )}
                  </td>
                  <td>
                    {t.deletedAt ? (
                      <AdminButton
                        type="button"
                        variant="primary"
                        onClick={() => void restoreRow(t)}
                      >
                        استرجاع
                      </AdminButton>
                    ) : (
                      <AdminButton
                        type="button"
                        variant="danger"
                        onClick={() => void archiveRow(t)}
                      >
                        أرشفة
                      </AdminButton>
                    )}
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
