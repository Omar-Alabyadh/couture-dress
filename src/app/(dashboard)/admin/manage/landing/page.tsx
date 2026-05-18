"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import {
  defaultLandingContent,
  type LandingContent,
} from "@/lib/types/landing";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import {
  AdminCard,
  AdminErrorState,
  AdminLoadingState,
  AdminSectionHeader,
} from "@/components/admin/AdminPrimitives";
import { LandingContentForm } from "@/components/admin/landing/LandingContentForm";

export default function AdminLandingPage() {
  const [content, setContent] = useState<LandingContent>(defaultLandingContent());
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/landing", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setErr(msg);
        return;
      }
      const j = (await r.json()) as { content: LandingContent };
      setContent(j.content ?? defaultLandingContent());
    } catch {
      setErr("تعذر تحميل محتوى الصفحة الرئيسية. تحقق من الاتصال وحاول مرة أخرى.");
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
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="الصفحة الرئيسية"
          description="عدّل نصوص وصور الواجهة العامة بشكل مرئي. خيارات JSON متقدمة للمطور فقط."
        />

        {loading ? <AdminLoadingState /> : null}
        {err && !loading ? (
          <AdminErrorState message={err} onRetry={() => void load()} />
        ) : null}

        {!loading && !err ? (
          <LandingContentForm
            initial={content}
            onSave={async (next) => {
              const r = await fetch("/api/admin/landing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(next),
              });
              if (!r.ok) {
                const msg =
                  (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
                throw new Error(msg);
              }
              setContent(next);
            }}
          />
        ) : null}
      </AdminCard>
    </div>
  );
}
