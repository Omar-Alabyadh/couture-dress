import HomePage from "@/components/sections/HomePage";
import { readPublicSocialUrls } from "@/lib/config/site";
import type { CollectionItemView } from "@/lib/types/collection";
import type {
  PublicBrandStripItem,
  PublicTestimonialHome,
} from "@/lib/types/home-cms";
import {
  getPublicBrandStripForHome,
  getPublicCollectionItemsForHome,
  getPublicTestimonialsForHome,
} from "@/server/services/contentService";
import { getPublicLandingContent } from "@/server/services/landingService";
import { defaultLandingContent } from "@/lib/types/landing";

// AR: الصفحة تعتمد على قاعدة البيانات؛ نجعلها ديناميكية حتى لا يفشل `next build` بدون DATABASE_URL.
// EN: Page depends on DB; force dynamic rendering so `next build` works without DATABASE_URL.
export const dynamic = "force-dynamic";

export default async function SiteHomePage() {
  if (process.env.SITE_RECOVERY === "1") {
    const socialUrls = readPublicSocialUrls();
    return (
      <HomePage
        collectionItems={[]}
        landing={defaultLandingContent()}
        socialUrls={socialUrls}
        testimonials={[]}
        brandStrip={[]}
      />
    );
  }

  let collectionItems: CollectionItemView[] = [];
  let landing = defaultLandingContent();
  let testimonials: PublicTestimonialHome[] = [];
  let brandStrip: PublicBrandStripItem[] = [];
  try {
    collectionItems = await getPublicCollectionItemsForHome();
  } catch (error) {
    console.error("[SiteHomePage] Failed to load collection items:", error);
    collectionItems = [];
  }
  try {
    landing = await getPublicLandingContent();
  } catch (error) {
    console.error("[SiteHomePage] Failed to load landing:", error);
    landing = defaultLandingContent();
  }
  try {
    testimonials = await getPublicTestimonialsForHome();
  } catch (error) {
    console.error("[SiteHomePage] Failed to load testimonials:", error);
    testimonials = [];
  }
  try {
    brandStrip = await getPublicBrandStripForHome();
  } catch (error) {
    console.error("[SiteHomePage] Failed to load brand strip:", error);
    brandStrip = [];
  }

  const socialUrls = readPublicSocialUrls();

  return (
    <HomePage
      collectionItems={collectionItems}
      landing={landing}
      socialUrls={socialUrls}
      testimonials={testimonials}
      brandStrip={brandStrip}
    />
  );
}
