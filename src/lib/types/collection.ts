export type CollectionCategory =
  | "dresses"
  | "abayas"
  | "casual"
  | "accessories";

export type ProductColorView = {
  id: string;
  label: string;
  hex: string | null;
};

/** AR: شكل عنصر المجموعة كما يحتاجه الواجهة. EN: Collection row shape for the UI layer. */
export type CollectionItemView = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  imageAlt: string;
  category: CollectionCategory;
  sizes: string[];
  colors: ProductColorView[];
};
