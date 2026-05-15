export type CollectionCategory =
  | "dresses"
  | "abayas"
  | "casual"
  | "accessories";

/** Stable order for homepage category previews and filters. */
export const COLLECTION_CATEGORY_ORDER: CollectionCategory[] = [
  "dresses",
  "abayas",
  "casual",
  "accessories",
];

export function isCollectionCategory(value: string): value is CollectionCategory {
  return (COLLECTION_CATEGORY_ORDER as readonly string[]).includes(value);
}

export type ProductColorView = {
  id: string;
  label: string;
  hex: string | null;
};

export type ProductImageView = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

/** Public + API shape for a sellable row (size / optional color / stock flags). */
export type ProductVariantView = {
  id: string;
  size: string;
  colorId: string | null;
  /** Label from product colors when colorId matches */
  colorLabel: string | null;
  quantity: number;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
  sortOrder: number;
};

/** True when variant can be sold as in-stock size */
export function isVariantSellable(v: Pick<ProductVariantView, "isAvailable" | "quantity">): boolean {
  return v.isAvailable && v.quantity > 0;
}

export type ProductBrandDesignerView = {
  id: string;
  nameAr: string;
  type: "BRAND" | "DESIGNER";
};

/** AR: شكل عنصر المجموعة كما يحتاجه الواجهة. EN: Collection row shape for the UI layer. */
export type CollectionItemView = {
  id: string;
  title: string;
  description: string | null;
  /** نسخة احتياطية متوافقة مع البيانات القديمة — يُفضَّل الاعتماد على primaryImage / images */
  imageUrl: string;
  imageAlt: string;
  images: ProductImageView[];
  /** أول صورة أساسية إن وُجدت؛ وإلا تُشتق من imageUrl */
  primaryImage: ProductImageView | null;
  /** تمثيل عشري كنص للعرض و JSON */
  price: string | null;
  currency: string;
  category: CollectionCategory;
  /** Legacy sizes array — kept in sync when saving from admin with variants */
  sizes: string[];
  colors: ProductColorView[];
  /** Empty when product has no DB variants yet — UI falls back to `sizes` */
  variants: ProductVariantView[];
  /** Distinct size tokens that are currently sellable (variants or legacy inference on server) */
  availableSizes: string[];
  /** Distinct size tokens present on non-sellable variants */
  unavailableSizes: string[];
  /** ماركة أو مصمم مرتبط — يظهر بخفة في الواجهة عند توفره ونشره */
  brandDesigner: ProductBrandDesignerView | null;
};
