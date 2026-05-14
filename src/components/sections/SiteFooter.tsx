"use client";

/* AR/EN: تذييل فاخر سينمائي — يحلّ محل التذييل القديم في الصفحة الرئيسية وصفحة المنتجات. */
/* eslint-disable @next/next/no-img-element -- match marketing image strategy used elsewhere */

import Link from "next/link";
import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { LuArrowUp, LuMapPin, LuPhone } from "react-icons/lu";
import { SiWhatsapp } from "react-icons/si";

import { SocialLinks } from "@/components/SocialLinks";
import Reveal from "@/components/motion/Reveal";
import { siteConfig, type PublicSocialUrls } from "@/lib/config/site";

const FOOTER_ACCORDION_MQ = "(max-width: 980px)";

function subscribeFooterAccordionMq(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(FOOTER_ACCORDION_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function snapshotFooterAccordionMq() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(FOOTER_ACCORDION_MQ).matches;
}

export type SiteFooterProps = {
  socialUrls: PublicSocialUrls;
  whatsappLink: string;
  brandAr?: string;
  brandEn?: string;
  /** Tagline shown beside the logo. */
  tagline?: string;
};

export default function SiteFooter({
  socialUrls,
  whatsappLink,
  brandAr = "كوتور للأزياء",
  brandEn = "COUTURE",
  tagline = "دار أزياء نسائية فاخرة — قطع مختارة بعناية، فرعا بنغازي وطرابلس.",
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  const accordionLayout = useSyncExternalStore(
    subscribeFooterAccordionMq,
    snapshotFooterAccordionMq,
    () => false,
  );
  const [openNav, setOpenNav] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [openContact, setOpenContact] = useState(false);

  const accNavBtnId = useId();
  const accNavPanelId = useId();
  const accCatBtnId = useId();
  const accCatPanelId = useId();
  const accContactBtnId = useId();
  const accContactPanelId = useId();

  const toggleNav = useCallback(() => {
    setOpenNav((v) => !v);
  }, []);
  const toggleCat = useCallback(() => {
    setOpenCat((v) => !v);
  }, []);
  const toggleContact = useCallback(() => {
    setOpenContact((v) => !v);
  }, []);

  function handleBackToTop() {
    if (typeof window === "undefined") return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <footer className="site-footer" aria-labelledby="site-footer-heading">
      <div className="site-footer__top-glow" aria-hidden="true" />
      <div className="site-footer__noise" aria-hidden="true" />
      <div className="site-footer__ambient" aria-hidden="true" />

      <div className="container site-footer__inner">
        <Reveal>
          <div className="site-footer__cta">
            <div className="site-footer__cta-ambient" aria-hidden="true" />
            <div className="site-footer__cta-text">
              <span className="site-footer__cta-eyebrow">خدمة شخصية</span>
              <h3 id="site-footer-heading" className="site-footer__cta-title">
                نساعدك على اختيار القطعة المثالية
              </h3>
              <p className="site-footer__cta-sub">
                راسلينا الآن على واتساب — ردّ سريع، ذوق راقٍ، ومساعدة على
                مدار الأسبوع.
              </p>
            </div>

            <a
              className="site-footer__cta-btn"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ابدئي محادثة واتساب"
            >
              <SiWhatsapp aria-hidden className="site-footer__cta-btn-icon" />
              <span>ابدئي محادثة واتساب</span>
            </a>
          </div>
        </Reveal>

        <hr className="site-footer__rule" aria-hidden="true" />

        <div className="site-footer__grid">
          <Reveal>
            <div className="site-footer__col site-footer__col--brand">
              <Link
                href="/"
                className="site-footer__brand"
                aria-label={`${brandAr} — ${brandEn}`}
              >
                <img
                  src="/assets/logo.jpeg"
                  alt={brandEn}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <span className="site-footer__brand-text">
                  <strong className="site-footer__brand-ar">{brandAr}</strong>
                  <span className="site-footer__brand-en">{brandEn}</span>
                </span>
              </Link>
              <p className="site-footer__tagline">{tagline}</p>
              <div className="site-footer__social-block">
                <span className="site-footer__social-label">تابعينا</span>
                <SocialLinks
                  className="social-links--footer"
                  urls={socialUrls}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div
              className="site-footer__acc-item"
              data-open={openNav ? "true" : "false"}
            >
              <button
                type="button"
                id={accNavBtnId}
                className="site-footer__acc-trigger"
                aria-expanded={openNav}
                aria-controls={accNavPanelId}
                tabIndex={accordionLayout ? 0 : -1}
                onClick={toggleNav}
              >
                <span className="site-footer__acc-trigger-label">
                  روابط سريعة
                </span>
                <span className="site-footer__acc-chevron" aria-hidden />
              </button>
              <div id={accNavPanelId} className="site-footer__acc-panel-wrap">
                <div
                  className="site-footer__acc-panel-inner"
                  {...(accordionLayout && !openNav ? { inert: true } : {})}
                >
                  <nav
                    className="site-footer__col"
                    aria-labelledby={
                      accordionLayout ? accNavBtnId : "site-footer-nav-heading"
                    }
                  >
                    <h4
                      id="site-footer-nav-heading"
                      className="site-footer__heading site-footer__heading--acc-panel"
                      aria-hidden={accordionLayout}
                    >
                      روابط سريعة
                    </h4>
                    <ul className="site-footer__list">
                      <li>
                        <Link href="/">الرئيسية</Link>
                      </li>
                      <li>
                        <Link href="/products">المنتجات</Link>
                      </li>
                      <li>
                        <Link href="/#about">من نحن</Link>
                      </li>
                      <li>
                        <Link href="/#features">مميزاتنا</Link>
                      </li>
                      <li>
                        <Link href="/#contact">تواصل</Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div
              className="site-footer__acc-item"
              data-open={openCat ? "true" : "false"}
            >
              <button
                type="button"
                id={accCatBtnId}
                className="site-footer__acc-trigger"
                aria-expanded={openCat}
                aria-controls={accCatPanelId}
                tabIndex={accordionLayout ? 0 : -1}
                onClick={toggleCat}
              >
                <span className="site-footer__acc-trigger-label">
                  المجموعات
                </span>
                <span className="site-footer__acc-chevron" aria-hidden />
              </button>
              <div id={accCatPanelId} className="site-footer__acc-panel-wrap">
                <div
                  className="site-footer__acc-panel-inner"
                  {...(accordionLayout && !openCat ? { inert: true } : {})}
                >
                  <nav
                    className="site-footer__col"
                    aria-labelledby={
                      accordionLayout ? accCatBtnId : "site-footer-cat-heading"
                    }
                  >
                    <h4
                      id="site-footer-cat-heading"
                      className="site-footer__heading site-footer__heading--acc-panel"
                      aria-hidden={accordionLayout}
                    >
                      المجموعات
                    </h4>
                    <ul className="site-footer__list">
                      <li>
                        <Link href="/products">فساتين</Link>
                      </li>
                      <li>
                        <Link href="/products">عبايات</Link>
                      </li>
                      <li>
                        <Link href="/products">كاجوال</Link>
                      </li>
                      <li>
                        <Link href="/products">إكسسوارات</Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div
              className="site-footer__acc-item site-footer__acc-item--contact"
              data-open={openContact ? "true" : "false"}
            >
              <button
                type="button"
                id={accContactBtnId}
                className="site-footer__acc-trigger"
                aria-expanded={openContact}
                aria-controls={accContactPanelId}
                tabIndex={accordionLayout ? 0 : -1}
                onClick={toggleContact}
              >
                <span className="site-footer__acc-trigger-label">
                  معلومات التواصل
                </span>
                <span className="site-footer__acc-chevron" aria-hidden />
              </button>
              <div
                id={accContactPanelId}
                className="site-footer__acc-panel-wrap"
              >
                <div
                  className="site-footer__acc-panel-inner"
                  {...(accordionLayout && !openContact ? { inert: true } : {})}
                >
                  <div
                    className="site-footer__col site-footer__col--contact"
                    aria-labelledby={
                      accordionLayout
                        ? accContactBtnId
                        : "site-footer-contact-heading"
                    }
                  >
                    <h4
                      id="site-footer-contact-heading"
                      className="site-footer__heading site-footer__heading--acc-panel"
                      aria-hidden={accordionLayout}
                    >
                      معلومات التواصل
                    </h4>
                    <ul
                      className="site-footer__list site-footer__list--contact"
                      dir="rtl"
                    >
                      <li>
                        <a
                          href={`tel:${siteConfig.phone}`}
                          className="site-footer__contact-row"
                        >
                          <span className="site-footer__contact-swatch">
                            <LuPhone aria-hidden />
                          </span>
                          <span className="site-footer__contact-body">
                            <span
                              className="site-footer__contact-primary site-footer__contact-primary--num"
                              dir="ltr"
                            >
                              +218 92 092 0500
                            </span>
                          </span>
                        </a>
                      </li>
                      <li>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="site-footer__contact-row"
                        >
                          <span className="site-footer__contact-swatch site-footer__contact-swatch--whats">
                            <SiWhatsapp aria-hidden />
                          </span>
                          <span className="site-footer__contact-body">
                            <span className="site-footer__contact-primary">
                              واتساب — تواصل سريع
                            </span>
                          </span>
                        </a>
                      </li>
                      {siteConfig.branches.map((branch) => (
                        <li key={branch.id}>
                          <div className="site-footer__contact-row site-footer__contact-row--static">
                            <span className="site-footer__contact-swatch">
                              <LuMapPin aria-hidden />
                            </span>
                            <div className="site-footer__contact-body">
                              <span className="site-footer__branch-title">
                                {branch.title}
                              </span>
                              <span className="site-footer__branch-addr">
                                {branch.addressLine}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">
            <span>© {year}</span>
            <span className="site-footer__copy-dot" aria-hidden>
              •
            </span>
            <span>
              <strong>{brandAr}</strong> — {brandEn}
            </span>
            <span className="site-footer__copy-dot" aria-hidden>
              •
            </span>
            <span className="site-footer__copy-rights">
              جميع الحقوق محفوظة
            </span>
          </p>
          <button
            type="button"
            onClick={handleBackToTop}
            className="site-footer__totop"
            aria-label="العودة لأعلى الصفحة"
          >
            <span className="site-footer__totop-label">للأعلى</span>
            <span className="site-footer__totop-icon" aria-hidden>
              <LuArrowUp />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
