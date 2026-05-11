"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

type Row = {
  id: string;
  titleAr: string;
  deletedAt: string | null;
  updatedAt: string;
};

export default function AdminTrashPage() {
  const [list, setList] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/trash/products", { cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as { data: Row[] };
      setList(j.data);
    }
  }, []);
  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);
  return (
    <div dir="rtl" style={{ maxWidth: 720 }}>
      <h1 style={{ margin: "0 0 0.3rem" }}>أرشيف المنتجات (محذوفة ناعمًا)</h1>
      {msg ? <p style={{ color: "#8c8" }}>{msg}</p> : null}
      {list.length === 0 ? (
        <p className="admin-hint">فارغ.</p>
      ) : (
        <table className="admin-table" style={{ marginTop: 10 }}>
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
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch(`/api/admin/products/${p.id}/restore`, {
                        method: "POST",
                      });
                      if (r.ok) {
                        setMsg("استرجع");
                        await load();
                      }
                    }}
                  >
                    استرجاع
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
