import { prisma } from "@/server/db/client";
import {
  sanitizeLandingHeroTitleHtml,
  sanitizeLandingHtmlFragment,
} from "@/lib/sanitize/landing-html";
import { clampHeroBgImageUrl } from "@/lib/validation/landing-asset-url";
import {
  LANDING_SETTING_KEY,
  defaultLandingContent,
  type LandingContent,
  parseLandingContent,
} from "@/lib/types/landing";

function normalizeLandingForStorage(content: LandingContent): LandingContent {
  const def = defaultLandingContent();
  return {
    ...content,
    heroTitleHtml: sanitizeLandingHeroTitleHtml(content.heroTitleHtml),
    aboutHtml: sanitizeLandingHtmlFragment(content.aboutHtml),
    heroBgImage: clampHeroBgImageUrl(content.heroBgImage, def.heroBgImage),
  };
}

export async function getPublicLandingContent(): Promise<LandingContent> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: LANDING_SETTING_KEY },
  });
  return parseLandingContent(row?.value);
}

export async function getLandingForAdmin(): Promise<{
  content: LandingContent;
  updatedAt: Date | null;
}> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: LANDING_SETTING_KEY },
  });
  if (!row) {
    return { content: defaultLandingContent(), updatedAt: null };
  }
  return { content: parseLandingContent(row.value), updatedAt: row.updatedAt };
}

export async function saveLandingContent(content: LandingContent) {
  const value = JSON.stringify(normalizeLandingForStorage(content));
  await prisma.siteSetting.upsert({
    where: { key: LANDING_SETTING_KEY },
    create: { key: LANDING_SETTING_KEY, value },
    update: { value },
  });
  return { content: parseLandingContent(value) };
}
