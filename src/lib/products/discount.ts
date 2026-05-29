/**
 * Percentage-discount logic for products (single source of truth).
 *
 * A discount applies only when ALL of the following hold:
 *  - `discountActive` is true
 *  - `discountPercent` is between 1 and 100
 *  - the product has a positive numeric price
 *
 * Final price = price - (price * percent / 100), rounded to 2 decimals.
 */

export const MIN_DISCOUNT_PERCENT = 0;
export const MAX_DISCOUNT_PERCENT = 100;

export type ProductDiscountInput = {
  price: string | null;
  discountPercent: number;
  discountActive: boolean;
};

export type ProductDiscountResult = {
  /** True only when a valid, active discount reduces the price. */
  hasDiscount: boolean;
  /** Clamped integer percent actually applied (0 when inactive). */
  percent: number;
  /** Original price as a normalized string (unchanged input when no discount). */
  originalPrice: string | null;
  /** Discounted price as a normalized string (equals original when no discount). */
  finalPrice: string | null;
};

/** Clamp any input to an integer percentage in [0, 100]. */
export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const i = Math.trunc(value);
  if (i < MIN_DISCOUNT_PERCENT) return MIN_DISCOUNT_PERCENT;
  if (i > MAX_DISCOUNT_PERCENT) return MAX_DISCOUNT_PERCENT;
  return i;
}

/** Format a numeric amount with up to 2 decimals and no trailing zeros. */
export function formatPriceAmount(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return String(rounded);
}

/**
 * Resolve the effective pricing for a product given its discount fields.
 * Safe to call with any input — never throws.
 */
export function resolveProductDiscount(
  input: ProductDiscountInput,
): ProductDiscountResult {
  const percent = clampDiscountPercent(input.discountPercent);
  const priceStr = input.price;
  const noDiscount: ProductDiscountResult = {
    hasDiscount: false,
    percent: 0,
    originalPrice: priceStr,
    finalPrice: priceStr,
  };

  if (!input.discountActive || percent <= 0) return noDiscount;
  if (priceStr == null || priceStr === "") return noDiscount;

  const n = Number(priceStr);
  if (!Number.isFinite(n) || n <= 0) return noDiscount;

  const final = (n * (MAX_DISCOUNT_PERCENT - percent)) / 100;
  return {
    hasDiscount: true,
    percent,
    originalPrice: formatPriceAmount(n),
    finalPrice: formatPriceAmount(final),
  };
}
