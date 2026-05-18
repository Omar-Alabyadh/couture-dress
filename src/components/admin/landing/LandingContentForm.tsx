"use client";

import { useState } from "react";
import {
  defaultLandingContent,
  type LandingContent,
  type LandingFeature,
} from "@/lib/types/landing";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

type Props = {
  initial: LandingContent;
  onSave: (content: LandingContent) => Promise<void>;
};

export function LandingContentForm({ initial, onSave }: Props) {
  const { pushToast } = useAdminToast();
  const [content, setContent] = useState<LandingContent>(initial);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(initial, null, 2));

  function patch<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(content);
      pushToast("تم حفظ الصفحة الرئيسية.", "success");
    } catch {
      pushToast("تعذر الحفظ.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-landing-form">
      <section className="admin-landing-form__section">
        <h3>البطل (Hero)</h3>
        <AdminField label="شارة أعلى العنوان">
          <AdminInput
            value={content.heroChip}
            onChange={(e) => patch("heroChip", e.target.value)}
          />
        </AdminField>
        <AdminField label="العنوان (يدعم HTML بسيط)">
          <AdminTextarea
            rows={2}
            value={content.heroTitleHtml}
            onChange={(e) => patch("heroTitleHtml", e.target.value)}
          />
        </AdminField>
        <AdminField label="النص الفرعي">
          <AdminTextarea
            rows={2}
            value={content.heroSubtitle}
            onChange={(e) => patch("heroSubtitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="صورة الخلفية (رابط)">
          <AdminInput
            dir="ltr"
            value={content.heroBgImage}
            onChange={(e) => patch("heroBgImage", e.target.value)}
          />
        </AdminField>
        <MediaPickerButton
          label="اختر صورة الخلفية من المكتبة"
          defaultUsageType="LANDING_IMAGE"
          defaultFolder="landing"
          onSelect={(a) => patch("heroBgImage", a.url)}
        />
        <AdminField label="زر رئيسي">
          <AdminInput
            value={content.heroPrimaryCtaLabel}
            onChange={(e) => patch("heroPrimaryCtaLabel", e.target.value)}
          />
        </AdminField>
        <AdminField label="زر واتساب">
          <AdminInput
            value={content.heroSecondaryCtaLabel}
            onChange={(e) => patch("heroSecondaryCtaLabel", e.target.value)}
          />
        </AdminField>
      </section>

      <section className="admin-landing-form__section">
        <h3>من نحن</h3>
        <AdminField label="العنوان">
          <AdminInput
            value={content.aboutTitle}
            onChange={(e) => patch("aboutTitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="النص (HTML بسيط)">
          <AdminTextarea
            rows={4}
            value={content.aboutHtml}
            onChange={(e) => patch("aboutHtml", e.target.value)}
          />
        </AdminField>
        <AdminField label="قائمة نقاط (سطر لكل نقطة)">
          <AdminTextarea
            rows={4}
            value={content.aboutList.join("\n")}
            onChange={(e) =>
              patch(
                "aboutList",
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
              )
            }
          />
        </AdminField>
        <AdminField label="رسالتنا — عنوان">
          <AdminInput
            value={content.missionTitle}
            onChange={(e) => patch("missionTitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="رسالتنا — نص">
          <AdminTextarea
            rows={2}
            value={content.missionText}
            onChange={(e) => patch("missionText", e.target.value)}
          />
        </AdminField>
        <AdminField label="رؤيتنا — عنوان">
          <AdminInput
            value={content.visionTitle}
            onChange={(e) => patch("visionTitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="رؤيتنا — نص">
          <AdminTextarea
            rows={2}
            value={content.visionText}
            onChange={(e) => patch("visionText", e.target.value)}
          />
        </AdminField>
      </section>

      <section className="admin-landing-form__section">
        <h3>الأقسام</h3>
        <AdminField label="عنوان القسم">
          <AdminInput
            value={content.collectionTitle}
            onChange={(e) => patch("collectionTitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="وصف القسم">
          <AdminTextarea
            rows={2}
            value={content.collectionSubtitle}
            onChange={(e) => patch("collectionSubtitle", e.target.value)}
          />
        </AdminField>
      </section>

      <section className="admin-landing-form__section">
        <h3>لماذا كوتور؟</h3>
        <AdminField label="عنوان القسم">
          <AdminInput
            value={content.featuresTitle}
            onChange={(e) => patch("featuresTitle", e.target.value)}
          />
        </AdminField>
        {content.features.map((f, i) => (
          <div key={i} className="admin-landing-form__feature-row">
            <AdminField label={`ميزة ${i + 1} — أيقونة`}>
              <AdminInput
                value={f.icon}
                onChange={(e) => {
                  const next = [...content.features] as LandingFeature[];
                  next[i] = { ...f, icon: e.target.value };
                  patch("features", next);
                }}
              />
            </AdminField>
            <AdminField label="عنوان">
              <AdminInput
                value={f.title}
                onChange={(e) => {
                  const next = [...content.features] as LandingFeature[];
                  next[i] = { ...f, title: e.target.value };
                  patch("features", next);
                }}
              />
            </AdminField>
            <AdminField label="نص">
              <AdminTextarea
                rows={2}
                value={f.text}
                onChange={(e) => {
                  const next = [...content.features] as LandingFeature[];
                  next[i] = { ...f, text: e.target.value };
                  patch("features", next);
                }}
              />
            </AdminField>
          </div>
        ))}
      </section>

      <section className="admin-landing-form__section">
        <h3>تواصل وتذييل</h3>
        <AdminField label="عنوان التواصل">
          <AdminInput
            value={content.contactTitle}
            onChange={(e) => patch("contactTitle", e.target.value)}
          />
        </AdminField>
        <AdminField label="مقدمة التواصل">
          <AdminTextarea
            rows={2}
            value={content.contactIntro}
            onChange={(e) => patch("contactIntro", e.target.value)}
          />
        </AdminField>
        <AdminField label="اسم العلامة (عربي)">
          <AdminInput
            value={content.footerAr}
            onChange={(e) => patch("footerAr", e.target.value)}
          />
        </AdminField>
        <AdminField label="اسم EN">
          <AdminInput
            value={content.footerEn}
            onChange={(e) => patch("footerEn", e.target.value)}
            dir="ltr"
          />
        </AdminField>
      </section>

      <div className="admin-form__submit-row">
        <AdminButton type="button" variant="primary" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "جارٍ الحفظ…" : "حفظ الصفحة الرئيسية"}
        </AdminButton>
        <AdminButton
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "إخفاء خيارات متقدمة" : "خيارات متقدمة (JSON)"}
        </AdminButton>
      </div>

      {showAdvanced ? (
        <section className="admin-landing-form__section">
          <AdminField label="JSON كامل">
            <AdminTextarea
              rows={16}
              dir="ltr"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
            />
          </AdminField>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              try {
                const parsed = JSON.parse(rawJson) as LandingContent;
                setContent({ ...defaultLandingContent(), ...parsed });
                pushToast("تم تحميل JSON في النموذج.", "success");
              } catch {
                pushToast("JSON غير صالح.", "error");
              }
            }}
          >
            تطبيق JSON على النموذج
          </AdminButton>
        </section>
      ) : null}
    </div>
  );
}
