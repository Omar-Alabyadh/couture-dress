export type SiteBranch = {
  id: string;
  title: string;
  addressLine: string;
  mapEmbedSrc: string;
  /** رابط خرائط جوجل الكامل (مثلاً maps.app.goo.gl) */
  mapOpenUrl?: string;
};

const tripoliMapQuery = encodeURIComponent(
  "طرابلس، شارع بن عاشور الرئيسي، ليبيا",
);

export const siteBranches: SiteBranch[] = [
  {
    id: "benghazi",
    title: "فرع بنغازي",
    addressLine:
      "بنغازي - بلعون كوبري الفرش سنتر إيلين في اتجاه شارع فينسيا",
    mapEmbedSrc:
      "https://www.google.com/maps?q=32.065307,20.086752&z=17&output=embed",
    mapOpenUrl: "https://maps.app.goo.gl/Limcfk7Sh7SLTTEi7?g_st=aw",
  },
  {
    id: "tripoli",
    title: "فرع طرابلس",
    addressLine: "طرابلس - شارع بن عاشور الرئيسي",
    mapEmbedSrc: `https://www.google.com/maps?q=${tripoliMapQuery}&z=17&output=embed`,
    mapOpenUrl: "https://maps.app.goo.gl/Ux1aoXG8iNyiCWAG8?g_st=ic",
  },
];

/**
 * روابط وسائل التواصل (يفتح كل رابط في تاب جديد).
 * يمكن ضبطها عبر .env.local:
 * NEXT_PUBLIC_SOCIAL_FACEBOOK_URL=...
 * NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL=...
 * NEXT_PUBLIC_SOCIAL_TIKTOK_URL=...
 * NEXT_PUBLIC_SOCIAL_SNAPCHAT_URL=... (مثال: https://www.snapchat.com/add/username)
 */
function publicSocialUrl(key: string): string {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

/** إن لم تُضبط متغيرات NEXT_PUBLIC_SOCIAL_* في .env.local، تُستخدم هذه القيم. */
const socialFallback = {
  facebook: "",
  instagram: "",
  tiktok: "",
  snapchat: "",
} as const;

/** روابط التواصل كما تُقرأ من البيئة — للاستخدام في Server Components فقط ثم تُمرَّر للعميل. */
export type PublicSocialUrls = {
  facebook: string;
  instagram: string;
  tiktok: string;
  snapchat: string;
};

/**
 * يقرأ NEXT_PUBLIC_SOCIAL_* مرة من الخادم.
 * لا تعتمدي على استيراد النتيجة داخل مكوّن عميل لضمان تطابق SSR والعميل.
 */
export function readPublicSocialUrls(): PublicSocialUrls {
  return {
    facebook:
      publicSocialUrl("NEXT_PUBLIC_SOCIAL_FACEBOOK_URL") ||
      socialFallback.facebook,
    instagram:
      publicSocialUrl("NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL") ||
      socialFallback.instagram,
    tiktok:
      publicSocialUrl("NEXT_PUBLIC_SOCIAL_TIKTOK_URL") || socialFallback.tiktok,
    snapchat:
      publicSocialUrl("NEXT_PUBLIC_SOCIAL_SNAPCHAT_URL") ||
      socialFallback.snapchat,
  };
}

export const siteConfig = {
  shopName: "كوتور للأزياء - COUTURE",
  whatsappNumber: "218920920500",
  phone: "+218920920500",
  branches: siteBranches,
};
