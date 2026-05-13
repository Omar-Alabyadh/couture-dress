"use client";

/**
 * Reveal — تنشيط ظهور لطيف عند التمرير، مبني على CSS فقط (transition + class).
 * Reveal — gentle scroll-triggered reveal animation, CSS-only transitions.
 *
 * - Uses a single IntersectionObserver per node; sets `data-revealed="true"` once visible.
 * - Honors `prefers-reduced-motion` by revealing immediately with no animation.
 * - SSR-safe: initial markup is `opacity: 0` for graceful pop-in; a `<noscript>` fallback
 *   in `layout.tsx` ensures content stays visible without JS.
 */

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
} from "react";

export type RevealVariant = "up" | "fade" | "zoom" | "left" | "right";

export type RevealProps = {
  as?: ElementType;
  variant?: RevealVariant;
  /** Delay before the reveal transition starts, in ms. */
  delay?: number;
  /** IntersectionObserver threshold, 0..1. */
  threshold?: number;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
  /** If false, hides again when scrolled out of view. */
  once?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
};

export default function Reveal({
  as,
  variant = "up",
  delay = 0,
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
  once = true,
  className,
  style,
  children,
  id,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      el.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.revealed = "true";
            if (once) {
              observer.unobserve(el);
            }
          } else if (!once) {
            delete el.dataset.revealed;
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  const variantClass = variant !== "up" ? ` reveal--${variant}` : "";
  const mergedStyle: CSSProperties = delay
    ? ({
        ["--reveal-delay" as string]: `${delay}ms`,
        ...style,
      } as CSSProperties)
    : (style ?? {});

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      id={id}
      className={`reveal${variantClass}${className ? ` ${className}` : ""}`}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
