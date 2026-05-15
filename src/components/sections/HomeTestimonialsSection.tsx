import type { PublicTestimonialHome } from "@/lib/types/home-cms";
import { LuUser } from "react-icons/lu";
import Reveal from "@/components/motion/Reveal";

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(1, Math.min(5, Math.floor(rating)));
  return (
    <span
      className="testimonial-card__stars"
      role="img"
      aria-label={`تقييم ${filled} من 5`}
    >
      <span className="testimonial-card__stars-filled" aria-hidden>
        {"★".repeat(filled)}
      </span>
      <span className="testimonial-card__stars-muted" aria-hidden>
        {"★".repeat(5 - filled)}
      </span>
    </span>
  );
}

function TestimonialAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  if (imageUrl?.trim()) {
    return (
      <div className="testimonial-card__avatar">
        <div className="testimonial-card__avatar-ring">
          {/* eslint-disable-next-line @next/next/no-img-element -- CMS image URLs */}
          <img
            src={imageUrl}
            alt={`صورة ${name}`}
            className="testimonial-card__avatar-img"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="testimonial-card__avatar" aria-hidden>
      <div className="testimonial-card__avatar-ring testimonial-card__avatar-ring--icon">
        <LuUser className="testimonial-card__avatar-icon" aria-hidden />
      </div>
    </div>
  );
}

export default function HomeTestimonialsSection({
  items,
}: {
  items: PublicTestimonialHome[];
}) {
  if (items.length === 0) return null;

  const count = Math.min(items.length, 9);

  return (
    <section
      className="section testimonials-section"
      aria-labelledby="home-testimonials-title"
      data-count={count}
    >
      <div className="container testimonials-section__container">
        <Reveal>
          <header className="testimonials-section__head">
            <h2 id="home-testimonials-title" className="testimonials-section__title">
              آراء العملاء
            </h2>
            <p className="testimonials-section__subtitle">
              كلمات من عميلاتنا تعكس تجربة كوتور الحقيقية.
            </p>
          </header>
        </Reveal>

        <div className="testimonials-section__track" role="list">
          {items.map((t, idx) => (
            <Reveal
              key={t.id}
              className="testimonials-section__cell"
              variant="zoom"
              delay={Math.min(idx * 55, 280)}
            >
              <article className="testimonial-card" role="listitem">
                <header className="testimonial-card__head">
                  <TestimonialAvatar
                    name={t.customerName}
                    imageUrl={t.imageUrl}
                  />
                  <div className="testimonial-card__meta">
                    <p className="testimonial-card__name">{t.customerName}</p>
                    <Stars rating={t.rating} />
                  </div>
                </header>
                <blockquote className="testimonial-card__quote">
                  <p className="testimonial-card__text">{t.text}</p>
                </blockquote>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
