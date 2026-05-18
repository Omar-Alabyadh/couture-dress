import {
  sanitizeLandingHeroTitleHtml,
  sanitizeLandingHtmlFragment,
} from "@/lib/sanitize/landing-html";
import { clampHeroBgImageUrl } from "@/lib/validation/landing-asset-url";

/** محتوى الصفحة الرئيسية القابل للتعديل من الداشبورد */
export type LandingStat = { num: string; label: string };

export type LandingFeature = { icon: string; title: string; text: string };

export type LandingContent = {
  heroChip: string;
  heroTitleHtml: string;
  heroSubtitle: string;
  heroBgImage: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  aboutTitle: string;
  aboutHtml: string;
  aboutList: string[];
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  collectionTitle: string;
  collectionSubtitle: string;
  stats: LandingStat[];
  featuresTitle: string;
  features: LandingFeature[];
  contactTitle: string;
  contactIntro: string;
  /** اسم العلامة (عربي) */
  footerAr: string;
  /** السطر الإنجليزي بجانب التذييل */
  footerEn: string;
};

export const LANDING_SETTING_KEY = "landing_v1";

/** نصوص contactIntro القديمة من لوحة التحكم — تُستبدل تلقائيًا بالنص الحالي في defaultLandingContent(). */
const LEGACY_CONTACT_INTRO_VALUES = new Set<string>([
  "للحجز والاستفسار، راسلينا على واتساب أو اتركي رسالة وسنرد عليك.",
  "للحجز والاستفسار، تواصلي معنا عبر الهاتف أو واتساب وسنرد عليك بكل اهتمام.",
]);

function upgradeLegacyContactIntro(content: LandingContent): LandingContent {
  const def = defaultLandingContent();
  const t =
    typeof content.contactIntro === "string" ? content.contactIntro.trim() : "";
  if (!t || LEGACY_CONTACT_INTRO_VALUES.has(t)) {
    return { ...content, contactIntro: def.contactIntro };
  }
  return content;
}

export function defaultLandingContent(): LandingContent {
  return {
    heroChip: "أزياء نسائية • فخامة • أناقة",
    heroTitleHtml:
      'إطلالتك تبدأ من <span class="gold">كوتور للأزياء</span>',
    heroSubtitle:
      "متجر متخصص في أحدث صيحات الموضة النسائية — فساتين، عبايات، كاجوال وإكسسوارات. اكتشفي تشكيلاتنا وتواصلي معنا للحجز والاستفسار.",
    heroBgImage: "/assets/hero.jpeg",
    heroPrimaryCtaLabel: "استعرضي المجموعة",
    heroSecondaryCtaLabel: "واتساب الآن",
    aboutTitle: "من نحن",
    aboutHtml:
      "<b>كوتور للأزياء (COUTURE)</b> متجر يقدم تشكيلة مميزة من الأزياء النسائية تجمع بين الأناقة والجودة والذوق الرفيع. نحرص على اختيار قطع تناسب جميع الأذواق وتمنحك إطلالة فريدة في كل مناسبة.",
    aboutList: [
      "فساتين سهرة ويومية",
      "عبايات وملابس محجبات",
      "كاجوال عصري",
      "إكسسوارات مختارة",
    ],
    missionTitle: "رسالتنا",
    missionText:
      "نوفر تجربة شراء مريحة، وتشكيلات راقية، وخدمة زبائن ممتازة — لأننا نؤمن أن الأناقة حق للجميع.",
    visionTitle: "رؤيتنا",
    visionText:
      "أن تصبح كوتور للأزياء الوجهة الأولى لكل سيدة تبحث عن أسلوب راقٍ ومميز.",
    collectionTitle: "الأقسام",
    collectionSubtitle:
      "اكتشفي أقسامنا المختارة — من الفساتين الراقية إلى الإكسسوارات التي تكمل إطلالتك.",
    stats: [
      { num: "+100", label: "قطعة مختارة" },
      { num: "أسبوعي", label: "تجديد الموديلات" },
      { num: "ممتازة", label: "جودة وخامة" },
    ],
    featuresTitle: "لماذا كوتور للأزياء؟",
    features: [
      { icon: "✦", title: "اختيار راقٍ", text: "قطع منتقاة بعناية لتناسب ذوقك." },
      { icon: "✓", title: "جودة ممتازة", text: "خامات ممتازة وتفاصيل دقيقة." },
      { icon: "⚡", title: "تحديث مستمر", text: "موديلات جديدة بشكل أسبوعي." },
      { icon: "☎", title: "تواصل سريع", text: "واتساب مباشر للحجز والاستفسار." },
      {
        icon: "💳",
        title: "وسائل دفع محلية ومصرفية",
        text: "إدفع لي، موبي كاش، تحويل مصرفي، One Pay، لي باي.",
      },
      {
        icon: "🚚",
        title: "توصيل لجميع مدن ليبيا",
        text: "نوصّل طلبك إلى مدينتك بكل عناية.",
      },
      {
        icon: "🌍",
        title: "توصيل دولي",
        text: "توصيل متاح أيضًا خارج ليبيا — تواصلي معنا للتفاصيل.",
      },
    ],
    contactTitle: "تواصل معنا",
    contactIntro:
      "للحجز والاستفسار، تواصلي معنا عبر الهاتف أو واتساب، وسنرد عليك بكل اهتمام.",
    footerAr: "كوتور للأزياء",
    footerEn: "COUTURE",
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function parseLandingContent(raw: string | null | undefined): LandingContent {
  const def = defaultLandingContent();
  if (!raw) return def;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!isRecord(j)) return def;
    if ("footerLine" in j && !("footerAr" in j) && typeof j.footerLine === "string") {
      (j as Record<string, unknown>).footerAr = j.footerLine;
    }
    const merged = {
      ...def,
      ...j,
      aboutList: Array.isArray(j.aboutList)
        ? (j.aboutList as string[]).filter((x) => typeof x === "string")
        : def.aboutList,
      stats: Array.isArray(j.stats)
        ? (j.stats as unknown[])
            .filter(
              (s): s is LandingStat =>
                isRecord(s) &&
                typeof s.num === "string" &&
                typeof s.label === "string",
            )
        : def.stats,
      features: Array.isArray(j.features)
        ? (j.features as unknown[])
            .filter(
              (f): f is LandingFeature =>
                isRecord(f) &&
                typeof f.icon === "string" &&
                typeof f.title === "string" &&
                typeof f.text === "string",
            )
        : def.features,
    };
    const heroTitleHtml =
      typeof merged.heroTitleHtml === "string"
        ? sanitizeLandingHeroTitleHtml(merged.heroTitleHtml)
        : def.heroTitleHtml;
    const aboutHtml =
      typeof merged.aboutHtml === "string"
        ? sanitizeLandingHtmlFragment(merged.aboutHtml)
        : def.aboutHtml;
    const heroBgImage = clampHeroBgImageUrl(
      typeof merged.heroBgImage === "string" ? merged.heroBgImage : def.heroBgImage,
      def.heroBgImage,
    );
    return upgradeLegacyContactIntro({
      ...merged,
      heroTitleHtml,
      aboutHtml,
      heroBgImage,
    });
  } catch {
    return def;
  }
}
