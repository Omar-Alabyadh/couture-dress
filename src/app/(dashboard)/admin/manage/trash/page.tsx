"use client";

import Link from "next/link";
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
  AdminTd,
} from "@/components/admin/AdminPrimitives";

type TrashEntityType =
  | "product"
  | "brand"
  | "testimonial"
  | "color"
  | "media";

type TrashRow = {
  entityType: TrashEntityType;
  id: string;
  label: string;
  archivedAt: string;
  moduleHref: string;
  moduleLabel: string;
  field: string;
};

const TYPE_LABELS: Record<TrashEntityType, string> = {
  product: "منتج",
  brand: "ماركة / مصمم",
  testimonial: "رأي عميل",
  color: "لون",
  media: "وسيط",
};

export default function AdminTrashPage() {
  const { pushToast } = useAdminToast();
  const [list, setList] = useState<TrashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/trash", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: TrashRow[] };
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

  async function restoreRow(row: TrashRow) {
    const key = `${row.entityType}:${row.id}`;
    setRestoringId(key);
    try {
      const r = await fetch("/api/admin/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: row.entityType, id: row.id }),
      });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        pushToast(msg, "error");
        return;
      }
      pushToast("تم الاسترجاع.", "success");
      await load();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="الأرشيف الموحّد"
          description="استرجاع المحتوى المؤرشف دون حذف نهائي. وسائط Supabase تُدار أيضًا من مكتبة الوسائط (فلتر «مؤرشفة»)."
        />

        <p className="admin-hint" style={{ marginBottom: 12 }}>
          <Link href="/admin/manage/media">مكتبة الوسائط</Link>
          {" — للوسائط المؤرشفة والمعاينة."}
        </p>

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && !loadError ? <AdminLoadingState /> : null}

        {!loading && !loadError && list.length === 0 ? (
          <AdminEmptyState
            title="الأرشيف فارغ"
            description="لا توجد عناصر مؤرشفة حاليًا."
          />
        ) : null}

        {!loading && !loadError && list.length > 0 ? (
          <AdminTable style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>النوع</th>
                <th>الاسم</th>
                <th>تاريخ الأرشفة</th>
                <th>المصدر</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const key = `${row.entityType}:${row.id}`;
                return (
                  <tr key={key}>
                    <AdminTd label="النوع">{TYPE_LABELS[row.entityType]}</AdminTd>
                    <AdminTd label="الاسم">{row.label}</AdminTd>
                    <AdminTd label="تاريخ الأرشفة">
                      {new Date(row.archivedAt).toLocaleString("ar-LY")}
                    </AdminTd>
                    <AdminTd label="المصدر">
                      <Link href={row.moduleHref}>{row.moduleLabel}</Link>
                    </AdminTd>
                    <AdminTd label="إجراءات" className="admin-table__cell--actions">
                      <AdminButton
                        type="button"
                        variant="primary"
                        disabled={restoringId === key}
                        onClick={() => void restoreRow(row)}
                      >
                        استرجاع
                      </AdminButton>
                    </AdminTd>
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
