import type { PublicBrandStripItem } from "@/lib/types/home-cms";
import { nameInitials } from "@/lib/home/initials";
import Reveal from "@/components/motion/Reveal";

function BrandLogo({ item }: { item: PublicBrandStripItem }) {
  const monogram = nameInitials(item.nameAr, 1);
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
  return (
    <div
      className="brand-card__logo-wrap brand-card__logo-wrap--monogram"
      aria-hidden
    >
      <span className="brand-card__monogram" aria-hidden>
        {monogram}
      </span>
    </div>
  );
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
