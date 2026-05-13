import { Cairo } from "next/font/google";

/**
 * Single Cairo configuration for the whole App Router (public, admin, auth).
 * Loaded once in `layout.tsx` via `className` on `<html>`.
 */
export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});
