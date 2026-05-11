"use client";

import { useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

type Color = {
  id: string;
  label: string;
  hex: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

export default function AdminColorsPage() {
  const [list, setList] = useState<Color[]>([]);
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    const r = await fetch("/api/admin/colors", { cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as { data: Color[] };
      setList(j.data);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const cancelSchedule = runAfterEffectFlush(() => {
      fetch("/api/admin/colors", { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok || !isMounted) return;
          const j = (await r.json()) as { data: Color[] };
          setList(j.data);
        })
        .catch(() => {});
    });
    return () => {
      isMounted = false;
      cancelSchedule();
    };
  }, []);
  return (
    <div dir="rtl" style={{ maxWidth: 640 }}>
      <h1 style={{ margin: "0 0 0.3rem" }}>ألوان الفلتر</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        تظهر في صفحة المنتجات كفلاتر. حذف اللون يكون ناعمًا.
      </p>
      {msg ? <p style={{ color: "#8c8" }}>{msg}</p> : null}
      <form
        className="admin-form"
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
          if (r.ok) {
            setLabel("");
            setHex("");
            setMsg("أُضيف");
            await load();
          } else {
            setMsg("فشل");
          }
        }}
      >
        <label>
          اسم اللون (للعميل)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            placeholder="مثال: كحلي"
          />
        </label>
        <label>
          سداسي اللون (اختياري) — بدون #
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="2a1b3c"
            dir="ltr"
          />
        </label>
        <button className="login-btn" type="submit" style={{ width: 160 }}>
          إضافة
        </button>
      </form>
      <table className="admin-table" style={{ marginTop: 20 }}>
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
              <td dir="ltr" style={{ fontSize: 12 }}>{c.hex ? `#${c.hex}` : "—"}</td>
              <td>
                {c.deletedAt ? null : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("أرشفة هذا اللون؟")) return;
                      const r = await fetch(`/api/admin/colors/${c.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ softDelete: true }),
                      });
                      if (r.ok) {
                        setMsg("أُرشف");
                        await load();
                      }
                    }}
                  >
                    أرشفة
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
