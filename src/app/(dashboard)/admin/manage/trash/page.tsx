"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
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

type Row = {
  id: string;
  titleAr: string;
  deletedAt: string | null;
  updatedAt: string;
};

export default function AdminTrashPage() {
  const { pushToast } = useAdminToast();
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/trash/products", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Row[] };
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

  return (
    <div dir="rtl" style={{ maxWidth: 720 }}>
      <AdminCard>
        <AdminSectionHeader
          title="أرشيف المنتجات (محذوفة ناعمًا)"
          description="استرجاع المنتج يعيده إلى القائمة النشطة."
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && !loadError ? <AdminLoadingState /> : null}

        {!loading && !loadError && list.length === 0 ? (
          <AdminEmptyState title="فارغ." description="لا توجد منتجات في الأرشيف." />
        ) : null}

        {!loading && !loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>عنوان</th>
                <th>توقيت الحذف</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.titleAr}</td>
                  <td>
                    {p.deletedAt
                      ? new Date(p.deletedAt).toLocaleString("ar-LY")
                      : "—"}
                  </td>
                  <td>
                    <AdminButton
                      type="button"
                      variant="primary"
                      onClick={async () => {
                        const r = await fetch(`/api/admin/products/${p.id}/restore`, {
                          method: "POST",
                        });
                        if (!r.ok) {
                          const msg =
                            (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
                          pushToast(msg, "error");
                          return;
                        }
                        pushToast("تم استرجاع المنتج.", "success");
                        await load();
                      }}
                    >
                      استرجاع
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
