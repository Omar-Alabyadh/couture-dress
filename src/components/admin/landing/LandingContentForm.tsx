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
import { AdminCollapsibleSection } from "@/components/admin/AdminCollapsibleSection";
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
      <div className="admin-landing-form__scroll">
        <AdminCollapsibleSection
          title="البطل (Hero)"
          description="العنوان، النص، الصورة، وأزرار الدعوة للإجراء"
          defaultOpen
        >
          <div className="admin-landing-form__grid admin-landing-form__grid--2">
            <AdminField label="شارة أعلى العنوان">
              <AdminInput
                value={content.heroChip}
                onChange={(e) => patch("heroChip", e.target.value)}
              />
            </AdminField>
            <AdminField label="صورة الخلفية (رابط)">
              <AdminInput
                dir="ltr"
                value={content.heroBgImage}
                onChange={(e) => patch("heroBgImage", e.target.value)}
              />
            </AdminField>
          </div>
          <div className="admin-landing-form__media-pick">
            <MediaPickerButton
              label="اختر صورة الخلفية من المكتبة"
              defaultUsageType="LANDING_IMAGE"
              defaultFolder="landing"
              onSelect={(a) => patch("heroBgImage", a.url)}
            />
          </div>
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
          <div className="admin-landing-form__grid admin-landing-form__grid--2">
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
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="من نحن"
          description="نبذة، نقاط، الرسالة والرؤية"
          defaultOpen={false}
        >
          <AdminField label="العنوان">
            <AdminInput
              value={content.aboutTitle}
              onChange={(e) => patch("aboutTitle", e.target.value)}
            />
          </AdminField>
          <AdminField label="النص (HTML بسيط)">
            <AdminTextarea
              rows={3}
              value={content.aboutHtml}
              onChange={(e) => patch("aboutHtml", e.target.value)}
            />
          </AdminField>
          <AdminField label="قائمة نقاط (سطر لكل نقطة)">
            <AdminTextarea
              rows={3}
              value={content.aboutList.join("\n")}
              onChange={(e) =>
                patch(
                  "aboutList",
                  e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                )
              }
            />
          </AdminField>
          <div className="admin-landing-form__grid admin-landing-form__grid--2">
            <AdminField label="رسالتنا — عنوان">
              <AdminInput
                value={content.missionTitle}
                onChange={(e) => patch("missionTitle", e.target.value)}
              />
            </AdminField>
            <AdminField label="رؤيتنا — عنوان">
              <AdminInput
                value={content.visionTitle}
                onChange={(e) => patch("visionTitle", e.target.value)}
              />
            </AdminField>
          </div>
          <div className="admin-landing-form__grid admin-landing-form__grid--2">
            <AdminField label="رسالتنا — نص">
              <AdminTextarea
                rows={2}
                value={content.missionText}
                onChange={(e) => patch("missionText", e.target.value)}
              />
            </AdminField>
            <AdminField label="رؤيتنا — نص">
              <AdminTextarea
                rows={2}
                value={content.visionText}
                onChange={(e) => patch("visionText", e.target.value)}
              />
            </AdminField>
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="الأقسام"
          description="عنوان ووصف قسم المجموعات في الصفحة"
          defaultOpen={false}
        >
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
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="لماذا كوتور؟"
          description={`${content.features.length} ميزة تظهر في الصفحة الرئيسية`}
          defaultOpen={false}
        >
          <AdminField label="عنوان القسم">
            <AdminInput
              value={content.featuresTitle}
              onChange={(e) => patch("featuresTitle", e.target.value)}
            />
          </AdminField>
          <div className="admin-landing-features">
            {content.features.map((f, i) => (
              <div key={i} className="admin-landing-feature-card">
                <div className="admin-landing-feature-card__head">
                  <span className="admin-landing-feature-card__index" aria-hidden>
                    {i + 1}
                  </span>
                  <div className="admin-landing-feature-card__fields">
                    <AdminField label="أيقونة">
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
                  </div>
                </div>
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
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="تواصل وتذييل"
          description="قسم التواصل واسم العلامة في التذييل"
          defaultOpen={false}
        >
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
          <div className="admin-landing-form__grid admin-landing-form__grid--2">
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
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="خيارات متقدمة (JSON)"
          description="للمطورين — تحرير المحتوى كاملاً أو استيراد JSON"
          defaultOpen={false}
        >
          <p className="admin-landing-form__advanced-hint admin-hint">
            عدّل JSON يدويًا ثم اضغط «تطبيق JSON على النموذج». لا يُحفظ تلقائيًا حتى
            تضغط «حفظ الصفحة الرئيسية».
          </p>
          <AdminField label="JSON كامل">
            <AdminTextarea
              rows={12}
              dir="ltr"
              className="admin-json"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
            />
          </AdminField>
          <div className="admin-landing-form__advanced-actions">
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
          </div>
        </AdminCollapsibleSection>
      </div>

      <div className="admin-landing-form__footer">
        <AdminButton
          type="button"
          variant="primary"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "جارٍ الحفظ…" : "حفظ الصفحة الرئيسية"}
        </AdminButton>
      </div>
    </div>
  );
}
