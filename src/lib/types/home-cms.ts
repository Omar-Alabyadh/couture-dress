/** Serialized testimonial for public home / API (no secrets). */
export type PublicTestimonialHome = {
  id: string;
  customerName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
};

/** Compact brand row for home strip / public API. */
export type PublicBrandStripItem = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  type: "BRAND" | "DESIGNER";
  logoUrl: string | null;
};
