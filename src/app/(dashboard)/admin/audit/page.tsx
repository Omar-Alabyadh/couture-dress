"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

type Row = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  user: { name: string | null; email: string | null } | null;
  metadata: unknown;
};

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch("/api/admin/audit-log", { cache: "no-store" });
      if (!r.ok) throw new Error("forbidden");
      const j = (await r.json()) as { data: Row[] };
      setRows(j.data);
    } catch {
      setErr("تعذر التحميل");
    }
  }, []);
  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);
  return (
    <div dir="rtl" style={{ overflow: "auto" }}>
      <h1 style={{ margin: "0 0 0.4rem" }}>سجل التدقيق</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        يسجّل الدخول، إنشاء/تعديل/حذف المنتجات، الألوان، وتحديث الصفحة
        الرئيسية.
      </p>
      {err ? <p style={{ color: "#c88" }}>{err}</p> : null}
      <table className="admin-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>الوقت</th>
            <th>الفعل</th>
            <th>النوع</th>
            <th>User</th>
            <th>IP</th>
            <th>تفاصيل</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toLocaleString("ar-LY")}</td>
              <td>{a.action}</td>
              <td>
                {a.entityType} {a.entityId ? <><br /><span style={{ opacity: 0.7 }}>{a.entityId}</span></> : null}
              </td>
              <td>
                {a.user?.name ?? "—"} <br />
                <span style={{ opacity: 0.7 }}>{a.user?.email}</span>
              </td>
              <td style={{ direction: "ltr" }}>{a.ip ?? "—"}</td>
              <td style={{ maxWidth: 200, fontSize: 10, direction: "ltr" }}>
                {a.metadata != null
                  ? JSON.stringify(a.metadata).slice(0, 180)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
