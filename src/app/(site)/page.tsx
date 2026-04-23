import HomePage from "@/components/sections/HomePage";
import type { CollectionItemView } from "@/lib/types/collection";
import { getPublicCollectionItemsForHome } from "@/server/services/contentService";

// AR: الصفحة تعتمد على قاعدة البيانات؛ نجعلها ديناميكية حتى لا يفشل `next build` بدون DATABASE_URL.
// EN: Page depends on DB; force dynamic rendering so `next build` works without DATABASE_URL.
export const dynamic = "force-dynamic";

export default async function SiteHomePage() {
  let collectionItems: CollectionItemView[] = [];
  try {
    collectionItems = await getPublicCollectionItemsForHome();
  } catch (error) {
    console.error("[SiteHomePage] Failed to load collection items:", error);
    collectionItems = [];
  }

  return <HomePage collectionItems={collectionItems} />;
}
