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
  AdminTd,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";

type Category = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

export default function AdminCategoriesPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
        return;
      }
      const j = (await r.json()) as { data: Category[] };
      setList(Array.isArray(j.data) ? j.data : []);
    } catch {
      setLoadError("تعذر تحميل الأقسام. تحقق من الاتصال وحاول مرة أخرى.");
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

  async function archiveRow(c: Category) {
    const ok = await requestConfirm({
      title: "أرشفة القسم",
      message: `هل تريد أرشفة قسم «${c.nameAr}»؟ المنتجات المرتبطة تبقى كما هي.`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تمت أرشفة القسم.", "success");
    await load();
  }

  async function restoreRow(c: Category) {
    const r = await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تم استرجاع القسم.", "success");
    await load();
  }

  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="أقسام المتجر"
          description="نظّم أقسام المنتجات (فساتين، عبايات، إكسسوارات…). تظهر في الصفحة الرئيسية وفلتر المنتجات."
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}
        {loading && list.length === 0 && !loadError ? <AdminLoadingState /> : null}

        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch("/api/admin/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameAr: nameAr.trim(),
                slug: slug.trim() || undefined,
                descriptionAr: descriptionAr.trim() || null,
                sortOrder: Number(sortOrder),
              }),
            });
            if (!r.ok) {
              pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
              return;
            }
            setNameAr("");
            setSlug("");
            setDescriptionAr("");
            setSortOrder("0");
            pushToast("تمت إضافة القسم.", "success");
            await load();
          }}
        >
          <AdminField label="اسم القسم (عربي)">
            <AdminInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
          </AdminField>
          <AdminField label="المعرّف (إنجليزي — اختياري)" hint="مثال: dresses">
            <AdminInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              dir="ltr"
              placeholder="dresses"
            />
          </AdminField>
          <AdminField label="وصف قصير (اختياري)">
            <AdminTextarea
              rows={2}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
            />
          </AdminField>
          <AdminField label="الترتيب">
            <AdminInput
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </AdminField>
          <div className="admin-form__submit-row">
            <AdminButton type="submit" variant="primary">
              إضافة قسم
            </AdminButton>
          </div>
        </form>

        {!loading && !loadError && list.filter((c) => !c.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد أقسام بعد"
            description="أضف أول قسم باستخدام النموذج أعلاه."
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 16 }} responsiveCards>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>المعرّف</th>
                <th>ترتيب</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ opacity: c.deletedAt ? 0.5 : 1 }}>
                  <AdminTd label="الاسم">{c.nameAr}</AdminTd>
                  <AdminTd label="المعرّف" dir="ltr">
                    {c.slug}
                  </AdminTd>
                  <AdminTd label="ترتيب">{c.sortOrder}</AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    {c.deletedAt ? (
                      <AdminButton type="button" variant="primary" onClick={() => void restoreRow(c)}>
                        استرجاع
                      </AdminButton>
                    ) : (
                      <AdminButton type="button" variant="danger" onClick={() => void archiveRow(c)}>
                        أرشفة
                      </AdminButton>
                    )}
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminCard>
    </div>
  );
}
