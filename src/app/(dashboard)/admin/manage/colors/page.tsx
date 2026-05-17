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
} from "@/components/admin/AdminPrimitives";

type Color = {
  id: string;
  label: string;
  hex: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

export default function AdminColorsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Color[]>([]);
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/colors", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Color[] };
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

  async function restoreColor(c: Color) {
    const r = await fetch(`/api/admin/colors/${c.id}`, {
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

  async function archiveColor(c: Color) {
    const ok = await requestConfirm({
      title: "أرشفة اللون",
      message: `هل تريدين أرشفة اللون «${c.label}»؟ لن يظهر في الفلاتر للمنتجات الجديدة.`,
      confirmLabel: "أرشِفي",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/colors/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تمت أرشفة اللون.", "success");
    await load();
  }

  return (
    <div dir="rtl" style={{ maxWidth: 640 }}>
      <AdminCard>
        <AdminSectionHeader
          title="ألوان الفلتر"
          description="تظهر في صفحة المنتجات كفلاتر. حذف اللون يكون ناعمًا."
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
            const r = await fetch("/api/admin/colors", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                label: label.trim(),
                hex: hex.trim() || null,
              }),
            });
            if (!r.ok) {
              const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
              pushToast(msg, "error");
              return;
            }
            setLabel("");
            setHex("");
            pushToast("تمت إضافة اللون.", "success");
            await load();
          }}
        >
          <AdminField label="اسم اللون (للعميل)">
            <AdminInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="مثال: كحلي"
            />
          </AdminField>
          <AdminField label="سداسي اللون (اختياري) — بدون #">
            <AdminInput
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="2a1b3c"
              dir="ltr"
            />
          </AdminField>
          <AdminButton type="submit" variant="primary" style={{ width: 160 }}>
            إضافة
          </AdminButton>
        </form>

        {!loading && !loadError && list.length === 0 ? (
          <AdminEmptyState
            title="لا توجد ألوان"
            description="أضيفي أول لون باستخدام النموذج أعلاه."
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>—</th>
                <th>لون</th>
                <th>Hex</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    opacity: c.deletedAt ? 0.5 : 1,
                  }}
                >
                  <td
                    style={{
                      width: 20,
                      background: c.hex ? `#${c.hex}` : "transparent",
                    }}
                  />
                  <td>
                    {c.label}
                    {c.deletedAt ? " (مُؤرشف)" : null}
                  </td>
                  <td dir="ltr" style={{ fontSize: 12 }}>
                    {c.hex ? `#${c.hex}` : "—"}
                  </td>
                  <td>
                    {c.deletedAt ? (
                      <AdminButton
                        type="button"
                        variant="primary"
                        onClick={() => void restoreColor(c)}
                      >
                        استرجاع
                      </AdminButton>
                    ) : (
                      <AdminButton
                        type="button"
                        variant="danger"
                        onClick={() => void archiveColor(c)}
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
