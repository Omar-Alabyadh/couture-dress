"use client";

/* AR/EN: نستخدم <img> مثل الموقع الأصلي (مسارات public/assets) لتفادي تعقيدات التحسين هنا. */
/* eslint-disable @next/next/no-img-element -- static marketing images match legacy HTML */

import { FormEvent, useMemo, useState } from "react";
import { siteConfig } from "@/lib/config/site";
import { buildWhatsappLink } from "@/lib/whatsapp";

type Category = "all" | "dresses" | "abayas" | "casual" | "accessories";

type ProductItem = {
  title: string;
  description: string;
  image: string;
  alt: string;
  category: Exclude<Category, "all">;
};

const products: ProductItem[] = [
  {
    title: "فستان أنيق",
    description: "تفاصيل راقية وخامة ممتازة.",
    image: "/assets/p1.jpg",
    alt: "فستان نسائي",
    category: "dresses",
  },
  {
    title: "عباية فخمة",
    description: "مناسبة للمناسبات والإطلالات اليومية.",
    image: "/assets/p2.jpg",
    alt: "عباية نسائية",
    category: "abayas",
  },
  {
    title: "طقم كاجوال",
    description: "ستايل مريح وعصري.",
    image: "/assets/p3.jpg",
    alt: "كاجوال نسائي",
    category: "casual",
  },
  {
    title: "إكسسوارات",
    description: "لمسة نهائية لإطلالة مثالية.",
    image: "/assets/p4.jpg",
    alt: "إكسسوارات نسائية",
    category: "accessories",
  },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const defaultMessage = `مرحباً، أريد الاستفسار عن موديلات ${siteConfig.shopName}.`;
  const defaultWhatsappLink = useMemo(
    () => buildWhatsappLink(defaultMessage),
    [defaultMessage],
  );

  const visibleProducts = useMemo(
    () =>
      activeCategory === "all"
        ? products
        : products.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  function handleItemOrder(title: string) {
    const message = `مرحباً، أريد طلب/الاستفسار عن: ${title} من ${siteConfig.shopName}.`;
    window.open(buildWhatsappLink(message), "_blank", "noopener,noreferrer");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    // AR: نبقي نفس تجربة الموقع الحالية بإرسال الرسالة إلى واتساب مباشرة.
    // EN: Keep the same UX by forwarding contact form data to WhatsApp.
    const whatsappMessage = `مرحباً، هذه رسالة من موقع ${siteConfig.shopName}:
الاسم: ${name}
الهاتف: ${phone}
الرسالة: ${message}`;

    window.open(
      buildWhatsappLink(whatsappMessage),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <a className="brand" href="#home" aria-label="كوتور للأزياء">
            <img
              src="/assets/logo.jpeg"
              alt="COUTURE"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="brand__text">
              <div className="brand__ar">كوتور للأزياء</div>
              <div className="brand__en">COUTURE</div>
            </div>
          </a>

          <nav className="nav">
            <a href="#about">من نحن</a>
            <a href="#collection">المجموعة</a>
            <a href="#features">مميزاتنا</a>
            <a href="#contact">تواصل</a>
          </nav>

          <button
            className="nav__toggle"
            aria-label="فتح القائمة"
            onClick={() => setMobileNavOpen((current) => !current)}
            type="button"
          >
            ☰
          </button>
        </div>
      </header>

      <div
        className="mobile-nav"
        id="mobileNav"
        style={{ display: mobileNavOpen ? "block" : "none" }}
      >
        <a href="#about" onClick={() => setMobileNavOpen(false)}>
          من نحن
        </a>
        <a href="#collection" onClick={() => setMobileNavOpen(false)}>
          المجموعة
        </a>
        <a href="#features" onClick={() => setMobileNavOpen(false)}>
          مميزاتنا
        </a>
        <a href="#contact" onClick={() => setMobileNavOpen(false)}>
          تواصل
        </a>
      </div>

      <main id="home" className="hero">
        <div
          className="hero__bg"
          style={{ backgroundImage: "url('/assets/hero.jpeg')" }}
        />
        <div className="hero__overlay" />

        <div className="container hero__content">
          <span className="chip">أزياء نسائية • فخامة • أناقة</span>

          <h1>
            إطلالتك تبدأ من <span className="gold">كوتور للأزياء</span>
          </h1>
          <p>
            متجر متخصص في أحدث صيحات الموضة النسائية — فساتين، عبايات، كاجوال
            وإكسسوارات. اكتشفي تشكيلاتنا وتواصلي معنا للحجز والاستفسار.
          </p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#collection">
              استعرضي المجموعة
            </a>
            <a
              className="btn btn--ghost"
              href={defaultWhatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              واتساب الآن
            </a>
          </div>

          <div className="hero__stats">
            <div className="stat">
              <div className="stat__num">+100</div>
              <div className="stat__label">قطعة مختارة</div>
            </div>
            <div className="stat">
              <div className="stat__num">أسبوعي</div>
              <div className="stat__label">تجديد الموديلات</div>
            </div>
            <div className="stat">
              <div className="stat__num">ممتازة</div>
              <div className="stat__label">جودة وخامة</div>
            </div>
          </div>
        </div>
      </main>

      <section id="about" className="section">
        <div className="container grid-2">
          <div>
            <h2 className="section__title">من نحن</h2>
            <p className="section__text">
              <b>كوتور للأزياء (COUTURE)</b> متجر يقدم تشكيلة مميزة من الأزياء
              النسائية تجمع بين الأناقة والجودة والذوق الرفيع. نحرص على اختيار
              قطع تناسب جميع الأذواق وتمنحك إطلالة فريدة في كل مناسبة.
            </p>
            <ul className="list">
              <li>فساتين سهرة ويومية</li>
              <li>عبايات وملابس محجبات</li>
              <li>كاجوال عصري</li>
              <li>إكسسوارات مختارة</li>
            </ul>
          </div>

          <div className="card glass">
            <h3 className="card__title">رسالتنا</h3>
            <p className="card__text">
              نوفر تجربة شراء مريحة، وتشكيلات راقية، وخدمة زبائن ممتازة — لأننا
              نؤمن أن الأناقة حق للجميع.
            </p>

            <div className="divider" />

            <h3 className="card__title">رؤيتنا</h3>
            <p className="card__text">
              أن تصبح كوتور للأزياء الوجهة الأولى لكل سيدة تبحث عن أسلوب راقٍ
              ومميز.
            </p>
          </div>
        </div>
      </section>

      <section id="collection" className="section section--alt">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">المجموعة</h2>
            <p className="section__text">
              {/* صور تجريبية — استبدليها بصور منتجات المحل لاحقًا. */}
            </p>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeCategory === "all" ? "active" : ""}`}
              data-filter="all"
              onClick={() => setActiveCategory("all")}
              type="button"
            >
              الكل
            </button>
            <button
              className={`tab ${activeCategory === "dresses" ? "active" : ""}`}
              data-filter="dresses"
              onClick={() => setActiveCategory("dresses")}
              type="button"
            >
              فساتين
            </button>
            <button
              className={`tab ${activeCategory === "abayas" ? "active" : ""}`}
              data-filter="abayas"
              onClick={() => setActiveCategory("abayas")}
              type="button"
            >
              عبايات
            </button>
            <button
              className={`tab ${activeCategory === "casual" ? "active" : ""}`}
              data-filter="casual"
              onClick={() => setActiveCategory("casual")}
              type="button"
            >
              كاجوال
            </button>
            <button
              className={`tab ${activeCategory === "accessories" ? "active" : ""}`}
              data-filter="accessories"
              onClick={() => setActiveCategory("accessories")}
              type="button"
            >
              إكسسوارات
            </button>
          </div>

          <div className="gallery" id="gallery">
            {visibleProducts.map((item) => (
              <article
                className="item"
                data-cat={item.category}
                key={item.title}
              >
                <img src={item.image} alt={item.alt} />
                <div className="item__body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button
                    className="btn btn--small btn--primary item__btn"
                    data-title={item.title}
                    onClick={() => handleItemOrder(item.title)}
                    type="button"
                  >
                    اطلبي عبر واتساب
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <h2 className="section__title">لماذا كوتور للأزياء؟</h2>

          <div className="features">
            <div className="feature">
              <div className="icon">✦</div>
              <h3>اختيار راقٍ</h3>
              <p>قطع منتقاة بعناية لتناسب ذوقك.</p>
            </div>
            <div className="feature">
              <div className="icon">✓</div>
              <h3>جودة ممتازة</h3>
              <p>خامات ممتازة وتفاصيل دقيقة.</p>
            </div>
            <div className="feature">
              <div className="icon">⚡</div>
              <h3>تحديث مستمر</h3>
              <p>موديلات جديدة بشكل أسبوعي.</p>
            </div>
            <div className="feature">
              <div className="icon">☎</div>
              <h3>تواصل سريع</h3>
              <p>واتساب مباشر للحجز والاستفسار.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section section--alt">
        <div className="container grid-2">
          <div>
            <h2 className="section__title">تواصل معنا</h2>
            <p className="section__text">
              للحجز والاستفسار، راسلينا على واتساب أو اتركي رسالة وسنرد عليك.
            </p>

            <div className="contact-card">
              <div className="contact-row">
                <span className="label">واتساب:</span>
                <a
                  href={defaultWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  اضغطي هنا للتواصل
                </a>
              </div>
              <div className="contact-row">
                <span className="label">هاتف:</span>
                <a href={`tel:${siteConfig.phone}`} dir="ltr">
                  +218 92 092 0500
                </a>
              </div>
              <div className="contact-row">
                <span className="label">الموقع:</span>
                <span>{siteConfig.location}</span>
              </div>
              <div
                style={{
                  marginTop: "14px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <iframe
                  title="خريطة الموقع"
                  src="https://www.google.com/maps?q=27.0437,20.0629&z=16&output=embed"
                  width="100%"
                  height={260}
                  style={{ border: 0, borderRadius: "16px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <form className="form" id="contactForm" onSubmit={handleSubmit}>
            <h3>أرسلي رسالة</h3>
            <label htmlFor="name">الاسم</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="اسمك"
              required
            />

            <label htmlFor="phone">رقم الهاتف</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="رقم الهاتف"
              required
            />

            <label htmlFor="message">الرسالة</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="اكتبي طلبك أو استفسارك..."
              required
            />

            <button className="btn btn--primary" type="submit">
              إرسال عبر واتساب
            </button>
            <p className="form-hint">
              سيتم فتح واتساب تلقائيًا مع الرسالة جاهزة للإرسال.
            </p>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <b>كوتور للأزياء</b> — COUTURE
            <div className="muted">© جميع الحقوق محفوظة</div>
          </div>
          <a className="to-top" href="#home">
            ↑ للأعلى
          </a>
        </div>
      </footer>

      <a
        className="whats-float"
        href={defaultWhatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="واتساب"
      >
        واتساب
      </a>
    </>
  );
}
