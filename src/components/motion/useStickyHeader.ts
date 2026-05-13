"use client";

/**
 * useStickyHeader — يضيف صنف `topbar--scrolled` عندما يتجاوز التمرير العتبة.
 * useStickyHeader — toggles a `topbar--scrolled` class once the scroll passes a threshold.
 *
 * Uses a single rAF-throttled scroll listener and a ref so React doesn't re-render on scroll.
 */

import { useEffect, useRef } from "react";

export function useStickyHeader<T extends HTMLElement = HTMLElement>(
  threshold = 12,
  className = "topbar--scrolled",
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    let frame = 0;

    const apply = () => {
      const isScrolled = window.scrollY > threshold;
      el.classList.toggle(className, isScrolled);
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold, className]);

  return ref;
}
