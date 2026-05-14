import ProductsPage from "@/components/sections/ProductsPage";
import { readPublicSocialUrls } from "@/lib/config/site";
import { isCollectionCategory, type CollectionCategory } from "@/lib/types/collection";

export const dynamic = "force-dynamic";

type ProductsSearchParams = { category?: string | string[] };

export default async function ProductsRoute({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}) {
  const socialUrls = readPublicSocialUrls();
  let initialCategory: CollectionCategory | undefined;
  const sp = searchParams ? await searchParams : {};
  const raw = sp.category;
  const one = Array.isArray(raw) ? raw[0] : raw;
  if (one && isCollectionCategory(one)) initialCategory = one;
  return (
    <ProductsPage socialUrls={socialUrls} initialCategory={initialCategory} />
  );
}
