import ProductsPage from "@/components/sections/ProductsPage";
import { readPublicSocialUrls } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export default function ProductsRoute() {
  const socialUrls = readPublicSocialUrls();
  return <ProductsPage socialUrls={socialUrls} />;
}
