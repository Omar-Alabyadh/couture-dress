import type { PublicBrandStripItem } from "@/lib/types/home-cms";
import Reveal from "@/components/motion/Reveal";

export default function HomeBrandStripSection({
  items,
}: {
  items: PublicBrandStripItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section
      className="section section--alt home-brand-strip"
      aria-labelledby="home-brand-strip-title"
    >
      <div className="container">
        <Reveal>
          <h2 id="home-brand-strip-title" className="home-brand-strip__title">
            ماركات ومصممون
          </h2>
        </Reveal>
        <div className="home-brand-strip__row" role="list">
          {items.map((b, idx) => (
            <Reveal key={b.id} delay={Math.min(idx * 40, 240)}>
              <div className="home-brand-strip__item" role="listitem">
                {b.logoUrl ? (
                  <div className="home-brand-strip__logo-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element -- public URLs from CMS */}
                    <img
                      src={b.logoUrl}
                      alt=""
                      className="home-brand-strip__logo"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="home-brand-strip__logo-wrap home-brand-strip__logo-wrap--empty" />
                )}
                <span className="home-brand-strip__name">{b.nameAr}</span>
                <span className="home-brand-strip__meta">
                  {b.type === "BRAND" ? "ماركة" : "مصمم"}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
