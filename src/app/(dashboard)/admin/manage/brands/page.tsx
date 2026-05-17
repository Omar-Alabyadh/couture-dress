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
  AdminSelect,
  AdminTable,
  AdminTd,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";

type Brand = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  type: "BRAND" | "DESIGNER";
  logoUrl: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  isPublished: boolean;
  sortOrder: number;
  deletedAt: string | null;
};

function typeLabel(t: Brand["type"]) {
  return t === "BRAND" ? "ماركة" : "مصمم";
}

function BrandLogoThumb({ url }: { url: string | null }) {
  const u = url?.trim();
  const [failed, setFailed] = useState(false);
  if (!u || failed) {
    return <div className="admin-table-thumb admin-table-thumb--empty">—</div>;
  }
  return (
    <div className="admin-table-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin list */}
      <img src={u} alt="" loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

function BrandEditPanel({
  initial,
  onClose,
  onSaved,
}: {
  initial: Brand;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [nameAr, setNameAr] = useState(initial.nameAr);
  const [nameEn, setNameEn] = useState(initial.nameEn ?? "");
  const [type, setType] = useState<Brand["type"]>(initial.type);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial.descriptionEn ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial.sortOrder));
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ marginTop: 16 }}>
      <AdminCard>
      <h3 style={{ marginTop: 0 }}>تعديل: {initial.nameAr}</h3>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const r = await fetch(`/api/admin/brands/${initial.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameAr: nameAr.trim(),
                nameEn: nameEn.trim() || null,
                type,
                logoUrl: logoUrl.trim() || null,
                descriptionAr: descriptionAr.trim() || null,
                descriptionEn: descriptionEn.trim() || null,
                sortOrder: Number(sortOrder),
                isPublished,
              }),
            });
            if (!r.ok) {
              const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
              pushToast(msg, "error");
              return;
            }
            pushToast("تم الحفظ.", "success");
            await onSaved();
          } finally {
            setLoading(false);
          }
        }}
      >
        <AdminField label="الاسم (عربي)">
          <AdminInput
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
        </AdminField>
        <AdminField label="الاسم (EN) اختياري">
          <AdminInput
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            dir="ltr"
          />
        </AdminField>
        <AdminField label="النوع">
          <AdminSelect
            value={type}
            onChange={(e) => setType(e.target.value as Brand["type"])}
          >
            <option value="BRAND">ماركة</option>
            <option value="DESIGNER">مصمم</option>
          </AdminSelect>
        </AdminField>
        <AdminField label="رابط الشعار (اختياري)">
          <AdminInput
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            dir="ltr"
            placeholder="https://… أو /assets/…"
          />
        </AdminField>
        <MediaPickerButton
          label="اختر شعار من مكتبة الوسائط"
          defaultUsageType="BRAND_LOGO"
          defaultFolder="brands"
          onSelect={(asset) => setLogoUrl(asset.url)}
        />
        <AdminField label="وصف عربي (اختياري)">
          <AdminTextarea
            rows={2}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </AdminField>
        <AdminField label="وصف EN (اختياري)">
          <AdminTextarea
            rows={2}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            dir="ltr"
          />
        </AdminField>
        <AdminField label="الترتيب">
          <AdminInput
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </AdminField>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          منشور للعامة
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <AdminButton type="submit" variant="primary" disabled={loading}>
            حفظ
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </AdminButton>
        </div>
      </form>
      </AdminCard>
    </div>
  );
}

export default function AdminBrandsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Brand[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [type, setType] = useState<Brand["type"]>("BRAND");
  const [logoUrl, setLogoUrl] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/brands", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Brand[] };
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

  async function restoreRow(b: Brand) {
    const r = await fetch(`/api/admin/brands/${b.id}`, {
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

  async function archiveRow(b: Brand) {
    const ok = await requestConfirm({
      title: "أرشفة السجل",
      message: `هل تريدين أرشفة «${b.nameAr}»؟ لن يظهر في الواجهة العامة.`,
      confirmLabel: "أرشِفي",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/brands/${b.id}`, {
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
    setEditing((e) => (e?.id === b.id ? null : e));
    await load();
  }

  async function togglePublished(b: Brand) {
    const r = await fetch(`/api/admin/brands/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !b.isPublished }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast(b.isPublished ? "أُخفيت عن العامة." : "أُعلنت للعامة.", "success");
    await load();
  }

  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="ماركات ومصممون"
          description="يُربَط اختياريًا بالمنتجات من صفحة المنتجات. الأرشفة لا تحذف الربط لكن تخفي الظهور العام."
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
            const r = await fetch("/api/admin/brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameAr: nameAr.trim(),
                nameEn: nameEn.trim() || null,
                type,
                logoUrl: logoUrl.trim() || null,
                descriptionAr: descriptionAr.trim() || null,
                sortOrder: Number(sortOrder),
              }),
            });
            if (!r.ok) {
              const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
              pushToast(msg, "error");
              return;
            }
            setNameAr("");
            setNameEn("");
            setType("BRAND");
            setLogoUrl("");
            setDescriptionAr("");
            setSortOrder("0");
            pushToast("تمت الإضافة.", "success");
            await load();
          }}
        >
          <AdminField label="الاسم (عربي)">
            <AdminInput
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
            />
          </AdminField>
          <AdminField label="الاسم (EN) اختياري">
            <AdminInput
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              dir="ltr"
            />
          </AdminField>
          <AdminField label="النوع">
            <AdminSelect
              value={type}
              onChange={(e) => setType(e.target.value as Brand["type"])}
            >
              <option value="BRAND">ماركة</option>
              <option value="DESIGNER">مصمم</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="رابط الشعار (اختياري)">
            <AdminInput
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              dir="ltr"
            />
          </AdminField>
          <MediaPickerButton
            label="اختر شعار من مكتبة الوسائط"
            defaultUsageType="BRAND_LOGO"
            defaultFolder="brands"
            onSelect={(asset) => setLogoUrl(asset.url)}
          />
          <AdminField label="وصف عربي (اختياري)">
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
              إضافة
            </AdminButton>
          </div>
        </form>

        {!loading && !loadError && list.filter((x) => !x.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد سجلات بعد"
            description="أضيفي أول ماركة أو مصمم باستخدام النموذج أعلاه."
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th aria-label="شعار">شعار</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>ترتيب</th>
                <th>نشر</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} style={{ opacity: b.deletedAt ? 0.45 : 1 }}>
                  <AdminTd label="">
                    <BrandLogoThumb url={b.logoUrl} />
                  </AdminTd>
                  <AdminTd label="الاسم">{b.nameAr}</AdminTd>
                  <AdminTd label="النوع">{typeLabel(b.type)}</AdminTd>
                  <AdminTd label="ترتيب">{b.sortOrder}</AdminTd>
                  <AdminTd label="نشر">
                    {b.deletedAt ? (
                      "—"
                    ) : (
                      <AdminButton
                        type="button"
                        variant="ghost"
                        onClick={() => void togglePublished(b)}
                      >
                        {b.isPublished ? "إخفاء" : "نشر"}
                      </AdminButton>
                    )}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <div className="admin-table__actions">
                      {b.deletedAt ? (
                        <AdminButton
                          type="button"
                          variant="primary"
                          onClick={() => void restoreRow(b)}
                        >
                          استرجاع
                        </AdminButton>
                      ) : (
                        <>
                          <AdminButton
                            type="button"
                            variant="ghost"
                            onClick={() => setEditing(b)}
                          >
                            تعديل
                          </AdminButton>
                          <AdminButton
                            type="button"
                            variant="danger"
                            onClick={() => void archiveRow(b)}
                          >
                            أرشفة
                          </AdminButton>
                        </>
                      )}
                    </div>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminCard>

      {editing && !editing.deletedAt ? (
        <BrandEditPanel
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
