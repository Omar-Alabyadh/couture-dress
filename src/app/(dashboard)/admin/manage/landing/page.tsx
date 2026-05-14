"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import {
  defaultLandingContent,
  type LandingContent,
} from "@/lib/types/landing";

export default function AdminLandingPage() {
  const [raw, setRaw] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch("/api/admin/landing", { cache: "no-store" });
    if (!r.ok) {
      setErr("تعذر التحميل");
      return;
    }
    const j = (await r.json()) as { content: LandingContent };
    setRaw(JSON.stringify(j.content ?? defaultLandingContent(), null, 2));
  }, []);
  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);
  return (
    <div dir="rtl" style={{ maxWidth: 900 }}>
      <h1 style={{ margin: "0 0 0.3rem" }}>الصفحة الرئيسية (JSON)</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        عدّلي المفاتيح: heroTitleHtml، heroBgImage، aboutHtml، aboutList، stats،
        features، contactTitle، contactIntro، وغيرها. احتفظي بصيغة JSON صالحة. النسخ
        الاحتياطي يدوي مُنصح به. نص contactIntro القديم المحفوظ مسبقًا يُحدَّث تلقائيًا
        إلى النسخة الحالية عند التحميل إن وافق النص المخزَّن القيمة الافتراضية السابقة.
      </p>
      {err ? <p style={{ color: "#c88" }}>{err}</p> : null}
      {msg ? <p style={{ color: "#8c8" }}>{msg}</p> : null}
      <textarea
        className="admin-json"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        style={{ width: "100%" }}
        spellCheck={false}
      />
      <p style={{ marginTop: 10 }}>
        <button
          className="login-btn"
          type="button"
          onClick={async () => {
            setMsg(null);
            try {
              const parsed = JSON.parse(raw) as LandingContent;
              if (typeof parsed.heroTitleHtml !== "string") {
                setErr("heroTitleHtml لازم يبقى نص");
                return;
              }
              const r = await fetch("/api/admin/landing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: raw,
              });
              if (r.ok) {
                setMsg("تم الحفظ");
                setErr(null);
              } else {
                setErr("رفض الحفظ");
              }
            } catch {
              setErr("JSON غير صالح");
            }
          }}
        >
          حفظ
        </button>{" "}
        <button type="button" onClick={load}>
          إعادة تحميل
        </button>{" "}
        <button
          type="button"
          onClick={() =>
            setRaw(
              JSON.stringify(
                (() => {
                  try {
                    return JSON.parse(raw) as object;
                  } catch {
                    return defaultLandingContent();
                  }
                })(),
                null,
                2,
              ),
            )
          }
        >
          تنسيق
        </button>
      </p>
    </div>
  );
}
