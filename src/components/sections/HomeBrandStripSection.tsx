import type { PublicBrandStripItem } from "@/lib/types/home-cms";
import Reveal from "@/components/motion/Reveal";

function BrandIconPlaceholder({ type }: { type: PublicBrandStripItem["type"] }) {
  const isBrand = type === "BRAND";
  return (
    <div
      className="brand-card__logo-wrap brand-card__logo-wrap--icon"
      aria-hidden
    >
      {isBrand ? (
        <svg
          className="brand-card__type-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9z" />
          <path d="M9 22V12h6v10" />
        </svg>
      ) : (
        <svg
          className="brand-card__type-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
        </svg>
      )}
    </div>
  );
}

function BrandLogo({ item }: { item: PublicBrandStripItem }) {
  if (item.logoUrl?.trim()) {
    return (
      <div className="brand-card__logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element -- CMS logo URLs */}
        <img
          src={item.logoUrl}
          alt={`شعار ${item.nameAr}`}
          className="brand-card__logo"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return <BrandIconPlaceholder type={item.type} />;
}

export default function HomeBrandStripSection({
  items,
}: {
  items: PublicBrandStripItem[];
}) {
  if (items.length === 0) return null;

  const count = Math.min(items.length, 14);

  return (
    <section
      className="section section--alt brand-strip-section"
      aria-labelledby="home-brand-strip-title"
      data-count={count}
    >
      <div className="container brand-strip-section__container">
        <Reveal>
          <header className="brand-strip-section__head">
            <h2 id="home-brand-strip-title" className="brand-strip-section__title">
              ماركات ومصممين
            </h2>
            <p className="brand-strip-section__subtitle">
              اختيارات مختارة بعناية من ماركات ومصممين.
            </p>
          </header>
        </Reveal>

        <div className="brand-strip-section__track" role="list">
          {items.map((b, idx) => (
            <Reveal
              key={b.id}
              className="brand-strip-section__cell"
              delay={Math.min(idx * 45, 220)}
            >
              <article className="brand-card" role="listitem">
                <BrandLogo item={b} />
                <h3 className="brand-card__name">{b.nameAr}</h3>
                <p className="brand-card__type">
                  {b.type === "BRAND" ? "ماركة" : "مصمم"}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
