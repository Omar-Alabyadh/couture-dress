"use client";

/**
 * Sends GA4 `page_view` on App Router client navigations. The initial page load is
 * covered by `GoogleAnalytics` from `@next/third-parties/google` (gtag config);
 * we skip the first effect run here to avoid duplicate hits on first paint.
 */
import { sendGAEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }

    const pathWithQuery = query ? `${pathname}?${query}` : pathname;
    sendGAEvent("event", "page_view", {
      page_path: pathWithQuery,
      page_location:
        typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname, query]);

  return null;
}
