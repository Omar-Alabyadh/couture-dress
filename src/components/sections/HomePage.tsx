"use client";

/* AR/EN: نستخدم <img> مثل الموقع الأصلي (مسارات public/assets) لتفادي تعقيدات التحسين هنا. */
/* eslint-disable @next/next/no-img-element -- static marketing images match legacy HTML */

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  COLLECTION_CATEGORY_ORDER,
  type CollectionCategory,
  type CollectionItemView,
} from "@/lib/types/collection";
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
import { buildStaticMapPreviewUrl } from "@/lib/maps/static-map-preview";
import {
  buildSiteWhatsappUrl,
  buildWhatsappMessage,
} from "@/lib/communication/whatsapp";
import { getShopName } from "@/lib/customer-service";
import Reveal from "@/components/motion/Reveal";
import { useStickyHeader } from "@/components/motion/useStickyHeader";
import { MobileNavShell } from "@/components/layout/MobileNavShell";
import SiteFooter from "@/components/sections/SiteFooter";
import HomeTestimonialsSection from "@/components/sections/HomeTestimonialsSection";
import HomeBrandStripSection from "@/components/sections/HomeBrandStripSection";
import type {
  PublicBrandStripItem,
  PublicTestimonialHome,
} from "@/lib/types/home-cms";

const HOME_CATEGORY_FALLBACK_IMAGE = "/assets/hero.jpeg";

/** AR: بطاقة مميّزة تحريريًا — يُفضّل عنوان «اختيار راقٍ» إن وُجد في المحتوى. */
const FEATURE_HIGHLIGHT_TITLE = "اختيار راقٍ";

const HOME_CATEGORY_PREVIEWS: Record<
  CollectionCategory,
  { title: string; description: string; ctaLabel: string }
> = {
  dresses: {
    title: "فساتين",
    description:
      "فساتين سهرة وزفاف بقصّات راقية ولمسات كوتور تليق بلحظاتك المميزة.",
    ctaLabel: "تصفحي المجموعة",
  },
  abayas: {
    title: "عبايات",
    description:
      "عبايات يومية وسهرة بخامات ناعمة وتفاصيل هادئة تعكس أناقتك اليومية.",
    ctaLabel: "تصفحي المجموعة",
  },
  casual: {
    title: "كاجوال",
    description:
      "قطع يومية مريحة بلمسة عصرية — توازن بين السهولة والتميز.",
    ctaLabel: "تصفحي المجموعة",
  },
  accessories: {
    title: "إكسسوارات",
    description: "لمسات تكمّل إطلالتك: حقائب وقطع مختارة بعناية.",
    ctaLabel: "تصفحي المجموعة",
  },
};

type HomePageProps = {
  collectionItems: CollectionItemView[];
  /** محتوى قابل للتعديل من الداشبورد */
  landing?: LandingContent;
  /** روابط التواصل كما قرأها الخادم — تُمرَّر للعميل لتفادي اختلاف SSR عن الحزمة */
  socialUrls: PublicSocialUrls;
  testimonials?: PublicTestimonialHome[];
  brandStrip?: PublicBrandStripItem[];
};

export default function HomePage({
  collectionItems,
  landing: landingProp,
  socialUrls,
  testimonials = [],
  brandStrip = [],
}: HomePageProps) {
  const landing = landingProp ?? defaultLandingContent();
  const heroBgSafe = clampHeroBgImageUrl(
    landing.heroBgImage,
    defaultLandingContent().heroBgImage,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const [mapBranchId, setMapBranchId] = useState(
    () => siteConfig.branches[0]?.id ?? "benghazi",
  );
  const [showInlineMap, setShowInlineMap] = useState(false);
  const [mapPreviewFailed, setMapPreviewFailed] = useState(false);
  const headerRef = useStickyHeader<HTMLElement>();
  const defaultWhatsappLink = useMemo(
    () =>
      buildSiteWhatsappUrl(
        buildWhatsappMessage("product_inquiry", { shopName: getShopName() }),
      ),
    [],
  );

  const mapBranch = useMemo(
    () =>
      siteConfig.branches.find((b) => b.id === mapBranchId) ??
      siteConfig.branches[0]!,
    [mapBranchId],
  );

  const mapPreviewSrc = useMemo(() => {
    if (mapBranch.mapPreviewImage) return mapBranch.mapPreviewImage;
    return buildStaticMapPreviewUrl(mapBranch.mapCenterLat, mapBranch.mapCenterLng, {
      width: 720,
      height: 240,
      zoom: 16,
    });
  }, [mapBranch]);

  function selectBranch(branchId: string) {
    setMapBranchId(branchId);
    setShowInlineMap(false);
    setMapPreviewFailed(false);
  }

  const categorySpotlightItem = useMemo(() => {
    const map = new Map<CollectionCategory, CollectionItemView>();
    for (const item of collectionItems) {
      if (!map.has(item.category)) map.set(item.category, item);
    }
    return map;
  }, [collectionItems]);

  const featuresHasHighlightTitle = useMemo(
    () =>
      landing.features.some(
        (x) => x.title.trim() === FEATURE_HIGHLIGHT_TITLE,
      ),
    [landing.features],
  );
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    // AR: نبقي نفس تجربة الموقع الحالية بإرسال الرسالة إلى واتساب مباشرة.
    // EN: Keep the same UX by forwarding contact form data to WhatsApp.
    const whatsappMessage = buildWhatsappMessage("contact_inquiry", {
      shopName: getShopName(),
      name,
      phone,
      message,
    });

    window.open(
      buildSiteWhatsappUrl(whatsappMessage),
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
            className={`nav__toggle${mobileNavOpen ? " nav__toggle--open" : ""}`}
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="mobileNav"
            aria-label={mobileNavOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setMobileNavOpen((current) => !current)}
          >
            <span className="nav__toggle-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <MobileNavShell
        open={mobileNavOpen}
        onClose={closeMobileNav}
        id="mobileNav"
      >
        <ul className="mobile-nav__list">
          <li>
            <Link
              href="/products"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              المنتجات
            </Link>
          </li>
          <li>
            <a href="#about" className="mobile-nav__link" onClick={closeMobileNav}>
              من نحن
            </a>
          </li>
          <li>
            <a
              href="#collection"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              المجموعة
            </a>
          </li>
          <li>
            <a
              href="#features"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              مميزاتنا
            </a>
          </li>
          <li>
            <a href="#contact" className="mobile-nav__link" onClick={closeMobileNav}>
              تواصل
            </a>
          </li>
        </ul>
      </MobileNavShell>

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
              {collectionItems.length === 0 ? (
                <p className="section__text" style={{ marginTop: "0.75rem" }}>
                  لا توجد معاينات من قاعدة البيانات بعد؛ تُعرض التصنيفات
                  بصور افتراضية. للمنتجات الكاملة تصفّحي صفحة المنتجات.
                </p>
              ) : null}
              <p style={{ marginTop: "0.5rem" }}>
                <Link className="btn btn--ghost" href="/products">
                  تصفحي جميع المنتجات والفلاتر
                </Link>
              </p>
            </div>
          </Reveal>

          <div className="gallery" id="gallery">
            {COLLECTION_CATEGORY_ORDER.map((categoryId, idx) => {
              const meta = HOME_CATEGORY_PREVIEWS[categoryId];
              const rep = categorySpotlightItem.get(categoryId);
              const imageUrl = rep?.imageUrl ?? HOME_CATEGORY_FALLBACK_IMAGE;
              const imageAlt =
                rep?.imageAlt ??
                `معاينة قسم ${meta.title} — كوتور للأزياء`;

              return (
                <Reveal
                  key={categoryId}
                  variant="zoom"
                  delay={Math.min(idx * 70, 420)}
                >
                  <Link
                    href={`/products?category=${categoryId}`}
                    className="item item--category-preview"
                    aria-labelledby={`collection-cat-${categoryId}`}
                  >
                    <div className="item__media">
                      <img src={imageUrl} alt={imageAlt} loading="lazy" />
                    </div>
                    <div className="item__body">
                      <h3 id={`collection-cat-${categoryId}`}>{meta.title}</h3>
                      <p>{meta.description}</p>
                      <span className="btn btn--small btn--primary item__btn">
                        {meta.ctaLabel}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="section section--features">
        <div className="container">
          <Reveal>
            <h2 className="section__title">{landing.featuresTitle}</h2>
          </Reveal>

          <div className="features-ambient">
            <div className="features">
              {landing.features.map((f, idx) => {
                const isFeatured = featuresHasHighlightTitle
                  ? f.title.trim() === FEATURE_HIGHLIGHT_TITLE
                  : idx === 0;
                return (
                  <Reveal key={f.title} delay={Math.min(idx * 90, 360)}>
                    <div
                      className={
                        isFeatured ? "feature feature--featured" : "feature"
                      }
                    >
                      <div className="icon" aria-hidden="true">
                        {f.icon}
                      </div>
                      <h3>{f.title}</h3>
                      <p>{f.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <HomeTestimonialsSection items={testimonials} />
      ) : null}
      {brandStrip.length > 0 ? <HomeBrandStripSection items={brandStrip} /> : null}

      <section id="contact" className="section section--alt section--contact">
        <div className="container">
          <Reveal>
            <header className="contact-section-head">
              <h2 className="section__title section__title--contact-head">
                {landing.contactTitle}
              </h2>
              <p className="section__text section__text--contact-head">
                {landing.contactIntro}
              </p>
            </header>
          </Reveal>

          <div className="grid-2 grid-2--contact-cards">
            <Reveal>
              <div className="contact-card contact-card--luxury">
              <div className="contact-row contact-row--whatsapp">
                <span className="label">واتساب:</span>
                <a
                  className="contact-whatsapp-link"
                  href={defaultWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-whatsapp-template="product_inquiry"
                  data-whatsapp-source="home_quick_link"
                >
                  اضغطي هنا للتواصل
                </a>
              </div>
              <div className="contact-row contact-row--phone">
                <span className="label">هاتف:</span>
                <a href={`tel:${siteConfig.phone}`} dir="ltr">
                  +218 92 092 0500
                </a>
              </div>
              <div className="contact-row contact-row--branches">
                <span className="label">الفروع:</span>
                <div className="contact-branch-picker">
                  {siteConfig.branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      className={`btn btn--small contact-branch-btn ${
                        mapBranchId === branch.id
                          ? "btn--primary contact-branch-btn--active"
                          : "btn--ghost"
                      }`}
                      onClick={() => selectBranch(branch.id)}
                    >
                      {branch.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="contact-map-card" aria-labelledby="contact-map-heading">
                <div
                  className={`contact-map-card__preview${showInlineMap ? " contact-map-card__preview--embedded" : ""}`}
                >
                  {!showInlineMap ? (
                    <>
                      <div
                        className={`contact-map-card__image-wrap${mapPreviewFailed ? " contact-map-card__image-wrap--fallback" : ""}`}
                      >
                        {!mapPreviewFailed ? (
                          <img
                            key={mapBranch.id}
                            src={mapPreviewSrc}
                            alt=""
                            width={720}
                            height={240}
                            className="contact-map-card__img"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => setMapPreviewFailed(true)}
                          />
                        ) : null}
                        <div
                          className="contact-map-card__pin"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="contact-map-card__overlay" />
                      <div className="contact-map-card__copy">
                        <h3 id="contact-map-heading" className="contact-map-card__title">
                          {mapBranch.title}
                        </h3>
                        <p className="contact-map-card__address">
                          {mapBranch.addressLine}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="contact-map-card__iframe-shell">
                      <p className="contact-map-card__iframe-caption">
                        {mapBranch.title}
                      </p>
                      <iframe
                        key={mapBranch.id}
                        title={`خريطة ${mapBranch.title}`}
                        src={mapBranch.mapEmbedSrc}
                        width="100%"
                        height={240}
                        className="contact-map-card__iframe"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <p className="contact-map-card__iframe-address">
                        {mapBranch.addressLine}
                      </p>
                    </div>
                  )}
                </div>
                <div className="contact-map-card__actions">
                  {mapBranch.mapOpenUrl ? (
                    <a
                      className="btn btn--small btn--contact-maps-cta contact-map-card__cta-maps"
                      href={mapBranch.mapOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      افتحي الموقع في خرائط Google
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--small btn--ghost contact-map-card__toggle-inline"
                    onClick={() => setShowInlineMap((v) => !v)}
                    aria-expanded={showInlineMap}
                  >
                    {showInlineMap
                      ? "إخفاء الخريطة المدمجة"
                      : "عرض الخريطة داخل الموقع"}
                  </button>
                </div>
              </div>
              </div>
            </Reveal>

            <Reveal delay={120} variant="left">
              <form
                className="form form--contact-luxury"
                id="contactForm"
                dir="rtl"
                onSubmit={handleSubmit}
                data-whatsapp-template="contact_inquiry"
              >
              <h3>أرسلي رسالة</h3>
              <label htmlFor="name">الاسم</label>
              <input
                type="text"
                id="name"
                name="name"
                dir="rtl"
                placeholder="اسمك"
                required
              />

              <label htmlFor="phone">رقم الهاتف</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                dir="rtl"
                inputMode="tel"
                autoComplete="tel"
                placeholder="رقم الهاتف"
                required
              />

              <label htmlFor="message">الرسالة</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                dir="rtl"
                placeholder="اكتبي طلبك أو استفسارك..."
                required
              />

              <button
                className="btn btn--primary contact-form__submit"
                type="submit"
              >
                إرسال الرسالة عبر واتساب
              </button>
              <p className="form-hint form-hint--luxury">
                سيتم فتح واتساب تلقائيًا مع الرسالة جاهزة للإرسال.
              </p>
            </form>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter
        socialUrls={socialUrls}
        whatsappLink={defaultWhatsappLink}
        whatsappLinkTemplate="product_inquiry"
        whatsappLinkSource="home_footer"
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
