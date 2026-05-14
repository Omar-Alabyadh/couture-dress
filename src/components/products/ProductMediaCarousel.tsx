"use client";

/* eslint-disable @next/next/no-img-element -- carousel uses static/public URLs */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type ProductSlide = {
  id: string;
  url: string;
  alt: string;
};

type ProductMediaCarouselProps = {
  slides: ProductSlide[];
  productLabel: string;
};

export function ProductMediaCarousel({
  slides,
  productLabel,
}: ProductMediaCarouselProps) {
  const baseId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const single = slides.length <= 1;
  const slide = slides[0];

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const len = slides.length;
      const next = ((i % len) + len) % len;
      const w = el.clientWidth;
      el.scrollTo({ left: next * w, behavior: "smooth" });
      setIndex(next);
    },
    [slides.length],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || single) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setIndex(Math.max(0, Math.min(i, slides.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [single, slides.length]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (single) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollToIndex(index + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollToIndex(index - 1);
    }
  };

  if (single && slide) {
    return (
      <div className="product-media product-media--single">
        <div className="product-media__frame">
          <img src={slide.url} alt={slide.alt} loading="lazy" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="product-media product-media--carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={`صور ${productLabel}`}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className="product-media__frame">
        <div className="product-media__scroller" ref={scrollerRef}>
          {slides.map((s, i) => (
            <figure
              key={s.id}
              id={`${baseId}-slide-${i}`}
              className="product-media__slide"
            >
              <img src={s.url} alt={s.alt} loading="lazy" />
            </figure>
          ))}
        </div>
        <button
          type="button"
          className="product-media__arrow product-media__arrow--prev"
          aria-label="الصورة السابقة"
          onClick={() => scrollToIndex(index - 1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="rgba(246,241,238,0.92)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="product-media__arrow product-media__arrow--next"
          aria-label="الصورة التالية"
          onClick={() => scrollToIndex(index + 1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              stroke="rgba(246,241,238,0.92)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="product-media__dots" role="tablist" aria-label="مؤشر الصور">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls={`${baseId}-slide-${i}`}
            id={`${baseId}-tab-${i}`}
            className={`product-media__dot${i === index ? " product-media__dot--active" : ""}`}
            aria-label={`الصورة ${i + 1} من ${slides.length}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
