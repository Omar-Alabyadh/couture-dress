import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import { GoogleAnalyticsPageViews } from "./GoogleAnalyticsPageViews";

/**
 * Production GA4 (Google Analytics 4) via the official Next.js `@next/third-parties`
 * integration: loads gtag after hydration and tracks SPA-style route changes.
 *
 * Rollback without redeploying logic: unset `NEXT_PUBLIC_GA_ID` or set `NEXT_PUBLIC_GA_DISABLED=true`.
 * Invalid measurement IDs are ignored so bad env cannot break the document.
 */
const gaDisabled =
  process.env.NEXT_PUBLIC_GA_DISABLED === "1" ||
  process.env.NEXT_PUBLIC_GA_DISABLED === "true";

const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const gaId = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : "";

/** Bypass analytics + third-party scripts when stabilizing production (set on the server only). */
const siteRecovery = process.env.SITE_RECOVERY === "1";

export function GoogleAnalyticsRoot() {
  if (siteRecovery || gaDisabled || !gaId) {
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
