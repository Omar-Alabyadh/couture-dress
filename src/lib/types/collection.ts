export type CollectionCategory =
  | "dresses"
  | "abayas"
  | "casual"
  | "accessories";

/** AR: شكل عنصر المجموعة كما يحتاجه الواجهة. EN: Collection row shape for the UI layer. */
export type CollectionItemView = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  imageAlt: string;
  category: CollectionCategory;
};
