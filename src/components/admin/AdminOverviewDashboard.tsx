"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import {
  AdminCard,
  AdminErrorState,
  AdminLoadingState,
} from "@/components/admin/AdminPrimitives";

type OverviewData = {
  totalProducts: number;
  publishedProducts: number;
  unavailableProducts: number;
  draftProducts: number;
  mediaCount: number;
  testimonialsCount: number;
  brandsCount: number;
  latestActivity: {
    at: string;
    action: string;
    entityType: string;
    userLabel: string;
  } | null;
};

const QUICK_LINKS = [
  { href: "/admin/manage/products", label: "المنتجات", hint: "إضافة وتعديل القطع" },
  { href: "/admin/manage/categories", label: "الأقسام", hint: "تنظيم أقسام المتجر" },
  { href: "/admin/manage/media", label: "مكتبة الوسائط", hint: "رفع وإدارة الصور" },
  { href: "/admin/manage/landing", label: "الصفحة الرئيسية", hint: "محتوى الواجهة" },
  { href: "/admin/manage/trash", label: "الأرشيف", hint: "استرجاع المحذوف" },
];

export function AdminOverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch("/api/admin/overview", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setError(msg);
        setData(null);
        return;
      }
      const j = (await r.json()) as { data: OverviewData };
      setData(j.data);
    } catch {
      setError("تعذر تحميل ملخص لوحة التحكم. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);

  if (loading) return <AdminLoadingState />;
  if (error) return <AdminErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  const stats = [
    { label: "إجمالي المنتجات", value: data.totalProducts },
    { label: "منشور", value: data.publishedProducts },
    { label: "غير متوفر", value: data.unavailableProducts },
    { label: "مسودة", value: data.draftProducts },
    { label: "وسائط", value: data.mediaCount },
    { label: "آراء العملاء", value: data.testimonialsCount },
    { label: "ماركات / مصممون", value: data.brandsCount },
  ];

  return (
    <div className="admin-overview">
      <div className="admin-overview__stats">
        {stats.map((s) => (
          <AdminCard key={s.label} className="admin-overview__stat-card">
            <p className="admin-overview__stat-label">{s.label}</p>
            <p className="admin-overview__stat-value">{s.value}</p>
          </AdminCard>
        ))}
      </div>

      {data.latestActivity ? (
        <AdminCard className="admin-overview__activity">
          <p className="admin-overview__stat-label">آخر نشاط</p>
          <p className="admin-hint">
            {data.latestActivity.userLabel} — {data.latestActivity.action} (
            {data.latestActivity.entityType}) —{" "}
            {new Date(data.latestActivity.at).toLocaleString("ar-LY")}
          </p>
        </AdminCard>
      ) : null}

      <div className="admin-overview__links">
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="admin-overview__link-card">
            <strong>{l.label}</strong>
            <span className="admin-hint">{l.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
