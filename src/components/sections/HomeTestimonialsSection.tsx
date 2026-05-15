import type { PublicTestimonialHome } from "@/lib/types/home-cms";
import Reveal from "@/components/motion/Reveal";

function Stars({ n }: { n: number }) {
  const c = Math.max(1, Math.min(5, Math.floor(n)));
  return (
    <span className="home-testimonials__stars" aria-label={`تقييم ${c} من 5`}>
      {"★".repeat(c)}
      <span className="home-testimonials__stars-muted">{"★".repeat(5 - c)}</span>
    </span>
  );
}

export default function HomeTestimonialsSection({
  items,
}: {
  items: PublicTestimonialHome[];
}) {
  if (items.length === 0) return null;
  return (
    <section
      className="section home-testimonials"
      aria-labelledby="home-testimonials-title"
    >
      <div className="container">
        <Reveal>
          <h2 id="home-testimonials-title" className="home-testimonials__title">
            آراء العملاء
          </h2>
        </Reveal>
        <div className="home-testimonials__scroller">
          {items.map((t, idx) => (
            <Reveal key={t.id} variant="zoom" delay={Math.min(idx * 50, 300)}>
              <article className="home-testimonials__card">
                <header className="home-testimonials__head">
                  {t.imageUrl ? (
                    <div className="home-testimonials__avatar-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.imageUrl}
                        alt=""
                        className="home-testimonials__avatar"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="home-testimonials__avatar-wrap home-testimonials__avatar-wrap--empty" />
                  )}
                  <div>
                    <p className="home-testimonials__name">{t.customerName}</p>
                    <Stars n={t.rating} />
                  </div>
                </header>
                <p className="home-testimonials__text">{t.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
