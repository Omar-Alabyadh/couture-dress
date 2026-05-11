import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import { GoogleAnalyticsPageViews } from "./GoogleAnalyticsPageViews";

/**
 * Production GA4 (Google Analytics 4) via the official Next.js `@next/third-parties`
 * integration: loads gtag after hydration and tracks SPA-style route changes.
 * Disabled when `NEXT_PUBLIC_GA_ID` is unset (e.g. local dev without analytics).
 */
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalyticsRoot() {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews />
      </Suspense>
    </>
  );
}
