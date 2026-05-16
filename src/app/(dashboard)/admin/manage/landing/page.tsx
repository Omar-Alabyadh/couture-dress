"use client";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import {
  defaultLandingContent,
  type LandingContent,
} from "@/lib/types/landing";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  AdminButton,
  AdminCard,
  AdminErrorState,
  AdminLoadingState,
  AdminSectionHeader,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";
import {
  copyTextToClipboard,
  tryInsertLandingHeroBgImage,
} from "@/lib/admin/media-ui";

export default function AdminLandingPage() {
  const { pushToast } = useAdminToast();
  const [raw, setRaw] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setRaw(JSON.stringify(j.content ?? defaultLandingContent(), null, 2));
    } catch {
      setErr("تعذر الاتصال بالخادم.");
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
    <div dir="rtl" style={{ maxWidth: 900 }}>
      <AdminCard>
        <AdminSectionHeader
          title="الصفحة الرئيسية (JSON)"
          description="عدّلي المفاتيح: heroTitleHtml، heroBgImage، aboutHtml، aboutList، stats، features، contactTitle، contactIntro، وغيرها. احتفظي بصيغة JSON صالحة. النسخ الاحتياطي يدوي مُنصح به. نص contactIntro القديم المحفوظ مسبقًا يُحدَّث تلقائيًا عند التحميل إن وافق النص المخزَّن القيمة الافتراضية السابقة."
        />

        {loading ? <AdminLoadingState /> : null}

        {err && !loading ? (
          <AdminErrorState message={err} onRetry={() => void load()} />
        ) : null}

        {!loading && !err ? (
          <>
            <div className="admin-landing-media-helper">
              <p className="admin-hint" style={{ margin: "0 0 8px" }}>
                لصورة الخلفية <code dir="ltr">heroBgImage</code>: إن كان JSON صالحًا
                يُحدَّث المفتاح تلقائيًا؛ وإلا يُنسخ الرابط إلى الحافظة.
              </p>
              <MediaPickerButton
                label="اختيار صورة heroBgImage من المكتبة"
                title="صورة الصفحة الرئيسية"
                defaultUsageType="LANDING_IMAGE"
                defaultFolder="landing"
                onSelect={async (asset) => {
                  const inserted = tryInsertLandingHeroBgImage(raw, asset.url);
                  if (inserted.ok) {
                    setRaw(inserted.next);
                    pushToast("تم تحديث heroBgImage في JSON.", "success");
                    return;
                  }
                  const ok = await copyTextToClipboard(asset.url);
                  pushToast(
                    ok
                      ? "JSON غير صالح — تم نسخ الرابط. ألصقيه يدويًا في heroBgImage."
                      : "JSON غير صالح — انسخي الرابط يدويًا من المكتبة.",
                    ok ? "success" : "error",
                  );
                }}
              />
            </div>
            <AdminTextarea
              className="admin-json"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              style={{ width: "100%" }}
              spellCheck={false}
            />
            <p style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <AdminButton
                type="button"
                variant="primary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setErr(null);
                  try {
                    const parsed = JSON.parse(raw) as LandingContent;
                    if (typeof parsed.heroTitleHtml !== "string") {
                      setErr("heroTitleHtml لازم يبقى نص");
                      pushToast("heroTitleHtml لازم يبقى نص", "error");
                      return;
                    }
                    const r = await fetch("/api/admin/landing", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: raw,
                    });
                    if (!r.ok) {
                      const msg =
                        (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
                      setErr(msg);
                      pushToast(msg, "error");
                      return;
                    }
                    pushToast("تم حفظ الصفحة الرئيسية.", "success");
                    setErr(null);
                  } catch {
                    const msg = "JSON غير صالح";
                    setErr(msg);
                    pushToast(msg, "error");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "…" : "حفظ"}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => void load()}
              >
                إعادة تحميل
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                disabled={saving}
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
              </AdminButton>
            </p>
          </>
        ) : null}
      </AdminCard>
    </div>
  );
}
