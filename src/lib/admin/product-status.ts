import { isProductSellable, isVariantSellable } from "@/lib/types/collection";

export type ProductAdminStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OUT_OF_STOCK"
  | "ARCHIVED";

export type ProductStatusInput = {
  isPublished: boolean;
  deletedAt?: string | null;
  variants?: { isAvailable: boolean; quantity: number }[];
  sizes?: string[];
};

export const PRODUCT_STATUS_LABELS: Record<ProductAdminStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  OUT_OF_STOCK: "غير متوفر",
  ARCHIVED: "مؤرشف",
};

export function deriveProductAdminStatus(
  product: ProductStatusInput,
): ProductAdminStatus {
  if (product.deletedAt) return "ARCHIVED";
  const variants = product.variants ?? [];
  const inStock = isProductSellable({
    variants: variants.map((v, i) => ({
      id: String(i),
      size: "",
      colorId: null,
      colorLabel: null,
      quantity: v.quantity,
      isAvailable: v.isAvailable,
      allowSpecialOrder: false,
      sortOrder: i,
    })),
    sizes: product.sizes ?? [],
  });
  if (!product.isPublished) return "DRAFT";
  if (!inStock) return "OUT_OF_STOCK";
  return "PUBLISHED";
}

export function variantRowSellable(
  quantity: number,
  isAvailable: boolean,
): boolean {
  return isVariantSellable({ quantity, isAvailable });
}
