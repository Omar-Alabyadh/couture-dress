"use client";

/* AR/EN: نستخدم <img> مثل الموقع الأصلي (مسارات public/assets) لتفادي تعقيدات التحسين هنا. */
/* eslint-disable @next/next/no-img-element -- static marketing images match legacy HTML */

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { CollectionCategory, CollectionItemView } from "@/lib/types/collection";
import {
  defaultLandingContent,
  type LandingContent,
} from "@/lib/types/landing";
import {
  sanitizeLandingHeroTitleHtml,
  sanitizeLandingHtmlFragment,
} from "@/lib/sanitize/landing-html";
import { clampHeroBgImageUrl } from "@/lib/validation/landing-asset-url";
import { SocialLinks } from "@/components/SocialLinks";
import type { PublicSocialUrls } from "@/lib/config/site";
import { siteConfig } from "@/lib/config/site";
import { buildWhatsappLink } from "@/lib/whatsapp";
import Reveal from "@/components/motion/Reveal";
import { useStickyHeader } from "@/components/motion/useStickyHeader";
import SiteFooter from "@/components/sections/SiteFooter";

type Category = "all" | CollectionCategory;

type HomePageProps = {
  collectionItems: CollectionItemView[];
  /** محتوى قابل للتعديل من الداشبورد */
  landing?: LandingContent;
  /** روابط التواصل كما قرأها الخادم — تُمرَّر للعميل لتفادي اختلاف SSR عن الحزمة */
  socialUrls: PublicSocialUrls;
};

export default function HomePage({
  collectionItems,
  landing: landingProp,
  socialUrls,
}: HomePageProps) {
  const landing = landingProp ?? defaultLandingContent();
  const heroBgSafe = clampHeroBgImageUrl(
    landing.heroBgImage,
    defaultLandingContent().heroBgImage,
  );
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mapBranchId, setMapBranchId] = useState(
    () => siteConfig.branches[0]?.id ?? "benghazi",
  );
  const headerRef = useStickyHeader<HTMLElement>();
  const defaultMessage = `مرحباً، أريد الاستفسار عن موديلات ${siteConfig.shopName}.`;
  const defaultWhatsappLink = useMemo(
    () => buildWhatsappLink(defaultMessage),
    [defaultMessage],
  );

  const mapBranch = useMemo(
    () =>
      siteConfig.branches.find((b) => b.id === mapBranchId) ??
      siteConfig.branches[0]!,
    [mapBranchId],
  );

  const visibleProducts = useMemo(
    () =>
      activeCategory === "all"
        ? collectionItems
        : collectionItems.filter((item) => item.category === activeCategory),
    [activeCategory, collectionItems],
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
      <header ref={headerRef} className="topbar">
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
            <Link href="/products">المنتجات</Link>
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
        className={`mobile-nav${mobileNavOpen ? " mobile-nav--open" : ""}`}
        id="mobileNav"
        aria-hidden={!mobileNavOpen}
      >
        <Link href="/products" onClick={() => setMobileNavOpen(false)}>
          المنتجات
        </Link>
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
          style={{
            backgroundImage: `url('${heroBgSafe}')`,
          }}
        />
        <div className="hero__overlay" />

        <div className="container hero__content">
          <span className="chip">{landing.heroChip}</span>

          <h1
            dangerouslySetInnerHTML={{
              __html: sanitizeLandingHeroTitleHtml(landing.heroTitleHtml),
            }}
          />
          <p>{landing.heroSubtitle}</p>

          <div className="hero__cta">
            <Link className="btn btn--primary" href="/products">
              {landing.heroPrimaryCtaLabel}
            </Link>
            <a
              className="btn btn--ghost"
              href={defaultWhatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {landing.heroSecondaryCtaLabel}
            </a>
          </div>

          <div className="hero__social" aria-label="حسابات التواصل الاجتماعي">
            <span className="hero__social-label">تابعينا</span>
            <SocialLinks urls={socialUrls} />
          </div>

          <div className="hero__stats">
            {landing.stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat__num">{s.num}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section id="about" className="section section--about">
        <div className="container grid-2">
          <Reveal>
            <h2 className="section__title">{landing.aboutTitle}</h2>
            <div
              className="section__text"
              dangerouslySetInnerHTML={{
                __html: sanitizeLandingHtmlFragment(landing.aboutHtml),
              }}
            />
            <ul className="list">
              {landing.aboutList.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} variant="left">
            <div className="card glass">
              <h3 className="card__title">{landing.missionTitle}</h3>
              <p className="card__text">{landing.missionText}</p>

              <div className="divider" />

              <h3 className="card__title">{landing.visionTitle}</h3>
              <p className="card__text">{landing.visionText}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="collection" className="section section--alt">
        <div className="container">
          <Reveal>
            <div className="section__head">
              <h2 className="section__title">{landing.collectionTitle}</h2>
              {landing.collectionSubtitle ? (
                <p className="section__text">{landing.collectionSubtitle}</p>
              ) : null}
              <p style={{ marginTop: "0.5rem" }}>
                <Link className="btn btn--ghost" href="/products">
                  تصفحي جميع المنتجات والفلاتر
                </Link>
              </p>
            </div>
          </Reveal>

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
            {collectionItems.length === 0 ? (
              <p className="section__text" style={{ gridColumn: "1 / -1" }}>
                لا توجد قطع في المجموعة بعد. / No collection items yet. ربطي
                قاعدة البيانات (DATABASE_URL) ثم نفّذي ترحيل Prisma وبذرة
                البيانات (prisma db seed). / Connect Postgres (DATABASE_URL),
                run Prisma migrations, then prisma db seed.
              </p>
            ) : visibleProducts.length === 0 ? (
              <p className="section__text" style={{ gridColumn: "1 / -1" }}>
                لا توجد قطع ضمن هذا التصنيف. / No items in this category.
              </p>
            ) : (
              visibleProducts.map((item, idx) => (
                <Reveal
                  key={item.id}
                  variant="zoom"
                  delay={Math.min(idx * 70, 420)}
                >
                  <article className="item" data-cat={item.category}>
                    <div className="item__media">
                      <img src={item.imageUrl} alt={item.imageAlt} loading="lazy" />
                    </div>
                    <div className="item__body">
                      <h3>{item.title}</h3>
                      {item.description ? <p>{item.description}</p> : null}
                      {(item.sizes.length > 0 || item.colors.length > 0) && (
                        <p className="item__meta muted" style={{ fontSize: 13, margin: "0 0 6px" }}>
                          {item.sizes.length > 0 ? (
                            <span>المقاسات: {item.sizes.join("، ")}</span>
                          ) : null}
                          {item.sizes.length > 0 && item.colors.length > 0
                            ? " · "
                            : null}
                          {item.colors.length > 0 ? (
                            <span>
                              {item.colors.map((c) => c.label).join("، ")}
                            </span>
                          ) : null}
                        </p>
                      )}
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
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <Reveal>
            <h2 className="section__title">{landing.featuresTitle}</h2>
          </Reveal>

          <div className="features">
            {landing.features.map((f, idx) => (
              <Reveal key={f.title} delay={Math.min(idx * 90, 360)}>
                <div className="feature">
                  <div className="icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section section--alt">
        <div className="container grid-2">
          <Reveal>
            <h2 className="section__title">{landing.contactTitle}</h2>
            <p className="section__text">{landing.contactIntro}</p>

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
              <div
                className="contact-row"
                style={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <span className="label">الفروع:</span>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    flex: "1 1 auto",
                    minWidth: 0,
                  }}
                >
                  {siteConfig.branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      className={`btn btn--small ${
                        mapBranchId === branch.id
                          ? "btn--primary"
                          : "btn--ghost"
                      }`}
                      onClick={() => setMapBranchId(branch.id)}
                    >
                      {branch.title}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="contact-row"
                style={{
                  marginTop: "14px",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: "6px",
                }}
              >
                <span>{mapBranch.addressLine}</span>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <iframe
                  key={mapBranch.id}
                  title={`خريطة ${mapBranch.title}`}
                  src={mapBranch.mapEmbedSrc}
                  width="100%"
                  height={260}
                  style={{ border: 0, borderRadius: "16px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {mapBranch.mapOpenUrl ? (
                <a
                  href={mapBranch.mapOpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: "10px" }}
                >
                  فتح الموقع في خرائط جوجل — {mapBranch.title}
                </a>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={120} variant="left">
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
          </Reveal>
        </div>
      </section>

      <SiteFooter
        socialUrls={socialUrls}
        whatsappLink={defaultWhatsappLink}
        brandAr={landing.footerAr}
        brandEn={landing.footerEn}
      />

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
