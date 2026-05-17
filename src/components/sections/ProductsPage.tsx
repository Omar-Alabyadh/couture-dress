"use client";

/* eslint-disable @next/next/no-img-element -- match marketing site */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import type {
  CollectionItemView,
  CollectionCategory,
  ProductVariantView,
} from "@/lib/types/collection";
import { isVariantSellable } from "@/lib/types/collection";
import type { PublicSocialUrls } from "@/lib/config/site";
import type { WhatsappTemplateKind } from "@/lib/communication/whatsapp";
import {
  buildProductWhatsappBody,
  buildSiteWhatsappUrl,
  buildWhatsappMessage,
} from "@/lib/communication/whatsapp";
import { getShopName } from "@/lib/customer-service";
import { formatProductPriceDisplay } from "@/lib/product-price";
import { PRODUCT_DELIVERY_NOTE } from "@/lib/config/product-display";
import { ProductMediaCarousel } from "@/components/products/ProductMediaCarousel";
import type { ProductSlide } from "@/components/products/ProductMediaCarousel";
import Reveal from "@/components/motion/Reveal";
import { useStickyHeader } from "@/components/motion/useStickyHeader";
import { MobileNavShell } from "@/components/layout/MobileNavShell";
import SiteFooter from "@/components/sections/SiteFooter";
import { LuxuryListbox } from "@/components/ui/LuxuryListbox";

type ColorOption = { id: string; label: string; hex: string | null };

type Category = "all" | "dresses" | "abayas" | "casual" | "accessories";

const categoryLabels: Record<Exclude<Category, "all">, string> = {
  dresses: "فساتين",
  abayas: "عبايات",
  casual: "كاجوال",
  accessories: "إكسسوارات",
};

function toProductSlides(item: CollectionItemView): ProductSlide[] {
  if (item.images.length > 0) {
    return [...item.images]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((im) => ({
        id: im.id,
        url: im.url,
        alt: im.alt ?? item.imageAlt,
      }));
  }
  return [
    {
      id: `legacy-${item.id}`,
      url: item.imageUrl,
      alt: item.imageAlt,
    },
  ];
}

function buildQuery(p: {
  q: string;
  name: string;
  size: string;
  colorId: string;
  category: Category;
}) {
  const u = new URLSearchParams();
  if (p.q.trim()) u.set("q", p.q.trim());
  if (p.name.trim()) u.set("name", p.name.trim());
  if (p.size) u.set("size", p.size);
  if (p.colorId) u.set("colorId", p.colorId);
  if (p.category !== "all") u.set("category", p.category);
  return u.toString();
}

/** Variants from DB, or legacy `sizes` as synthetic in-stock rows */
function displayVariantsForProduct(item: CollectionItemView): ProductVariantView[] {
  if (item.variants.length > 0) return item.variants;
  return item.sizes.map((s, i) => ({
    id: `legacy:${item.id}:${i}:${s}`,
    size: s,
    colorId: null,
    colorLabel: null,
    quantity: 1,
    isAvailable: true,
    allowSpecialOrder: false,
    sortOrder: i,
  }));
}

function productHasSpecialOrderOption(item: CollectionItemView): boolean {
  return displayVariantsForProduct(item).some(
    (v) => !isVariantSellable(v) && v.allowSpecialOrder,
  );
}

function defaultVariantIdForProduct(item: CollectionItemView): string | null {
  const rows = displayVariantsForProduct(item);
  const sellable = rows.find(isVariantSellable);
  if (sellable) return sellable.id;
  const special = rows.find((v) => !isVariantSellable(v) && v.allowSpecialOrder);
  return special?.id ?? rows[0]?.id ?? null;
}

function canOrderProduct(
  item: CollectionItemView,
  selectedVariantId: string | null,
): boolean {
  if (!item.inStock && !productHasSpecialOrderOption(item)) return false;
  const rows = displayVariantsForProduct(item);
  if (rows.length === 0) return item.inStock;
  const v = selectedVariantId
    ? rows.find((r) => r.id === selectedVariantId) ?? null
    : null;
  if (!v) return item.inStock || productHasSpecialOrderOption(item);
  if (isVariantSellable(v)) return true;
  return Boolean(v.allowSpecialOrder);
}

function orderButtonLabel(
  item: CollectionItemView,
  selectedVariantId: string | null,
): string {
  if (!item.inStock && !productHasSpecialOrderOption(item)) {
    return "غير متوفر حاليًا";
  }
  const rows = displayVariantsForProduct(item);
  const v = selectedVariantId
    ? rows.find((r) => r.id === selectedVariantId) ?? null
    : null;
  if (v && !isVariantSellable(v) && v.allowSpecialOrder) {
    return "طلب خاص عبر واتساب";
  }
  if (v && !isVariantSellable(v)) return "استفسار عبر واتساب";
  return "اطلبي عبر واتساب";
}

function productWhatsappTemplateKind(
  item: CollectionItemView,
  selectedVariantId: string | null,
): WhatsappTemplateKind {
  const rows = displayVariantsForProduct(item);
  const v = selectedVariantId
    ? rows.find((r) => r.id === selectedVariantId) ?? null
    : null;
  const sellable = v ? isVariantSellable(v) : false;
  const special = Boolean(v && !sellable && v.allowSpecialOrder);
  const unavailableNoSpecial = Boolean(v && !sellable && !v.allowSpecialOrder);
  if (special) return "special_order";
  if (unavailableNoSpecial) return "unavailable_size_inquiry";
  return "product_order";
}

type ProductsPageProps = {
  /** روابط التواصل من الخادم (تحافظ على تطابق SSR/CSR). */
  socialUrls: PublicSocialUrls;
  /** من عنوان الصفحة `?category=` عند فتح `/products?category=dresses` */
  initialCategory?: CollectionCategory;
};

export default function ProductsPage({
  socialUrls,
  initialCategory,
}: ProductsPageProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const headerRef = useStickyHeader<HTMLElement>();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [colorId, setColorId] = useState("");
  const [category, setCategory] = useState<Category>(() =>
    initialCategory ?? "all",
  );
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<CollectionItemView[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const qs = buildQuery({
      q: debouncedQ,
      name,
      size,
      colorId,
      category,
    });
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        fetch(`/api/public/products?${qs}`, { cache: "no-store" }),
        fetch("/api/public/colors", { cache: "no-store" }),
        fetch("/api/public/sizes", { cache: "no-store" }),
      ]);
      if (!pRes.ok) throw new Error("fetch");
      const pJson = (await pRes.json()) as { data: CollectionItemView[] };
      setItems(pJson.data);
      if (cRes.ok) {
        const c = (await cRes.json()) as { data: ColorOption[] };
        setColors(c.data);
      }
      if (sRes.ok) {
        const s = (await sRes.json()) as { data: string[] };
        setSizes(s.data);
      }
    } catch {
      setErr("تعذر تحميل المنتجات. تحقق من الاتصال أو لاحقًا.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, name, size, colorId, category]);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void refetch();
    });
  }, [refetch]);

  const defaultWhatsapp = useMemo(
    () =>
      buildSiteWhatsappUrl(
        buildWhatsappMessage("product_inquiry", { shopName: getShopName() }),
      ),
    [],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "الكل" },
      ...Object.entries(categoryLabels).map(([k, l]) => ({
        value: k,
        label: l,
      })),
    ],
    [],
  );

  const sizeOptions = useMemo(
    () => [
      { value: "", label: "— أي مقاس —" },
      ...sizes.map((z) => ({ value: z, label: z })),
    ],
    [sizes],
  );

  const colorOptions = useMemo(
    () => [
      { value: "", label: "— أي لون —" },
      ...colors.map((c) => ({
        value: c.id,
        label: `${c.label}${c.hex ? ` (#${c.hex})` : ""}`,
      })),
    ],
    [colors],
  );

  function orderProduct(item: CollectionItemView, selectedVariantId: string | null) {
    const rows = displayVariantsForProduct(item);
    const v = selectedVariantId
      ? rows.find((r) => r.id === selectedVariantId) ?? null
      : null;
    const sellable = v ? isVariantSellable(v) : false;
    const special = Boolean(v && !sellable && v.allowSpecialOrder);
    const unavailableNoSpecial = Boolean(v && !sellable && !v.allowSpecialOrder);
    const message = buildProductWhatsappBody({
      productTitle: item.title,
      price: item.price,
      currency: item.currency,
      selectedSize: v?.size ?? null,
      selectedColorLabel: v?.colorLabel ?? null,
      specialOrderMode: special,
      unavailableNoSpecial: unavailableNoSpecial && !special,
    });
    window.open(buildSiteWhatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <header ref={headerRef} className="topbar">
        <div className="container topbar__inner">
          <Link className="brand" href="/" aria-label="العودة للرئيسية">
            <img
              src="/assets/logo.jpeg"
              alt="COUTURE"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="brand__text">
              <div className="brand__ar">كوتور للأزياء</div>
              <div className="brand__en">COUTURE</div>
            </div>
          </Link>
          <nav className="nav">
            <Link href="/#about">من نحن</Link>
            <Link href="/#collection">المجموعة</Link>
            <Link href="/#features">مميزاتنا</Link>
            <Link href="/#contact">تواصل</Link>
            <span className="nav__current" aria-current="page">
              المنتجات
            </span>
          </nav>
          <button
            className={`nav__toggle${mobileNavOpen ? " nav__toggle--open" : ""}`}
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="mobileNav"
            aria-label={mobileNavOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setMobileNavOpen((c) => !c)}
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
              href="/#about"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              من نحن
            </Link>
          </li>
          <li>
            <Link
              href="/#collection"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              المجموعة
            </Link>
          </li>
          <li>
            <Link
              href="/#features"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              مميزاتنا
            </Link>
          </li>
          <li>
            <Link
              href="/#contact"
              className="mobile-nav__link"
              onClick={closeMobileNav}
            >
              تواصل
            </Link>
          </li>
          <li>
            <Link
              href="/products"
              className="mobile-nav__link mobile-nav__link--current"
              aria-current="page"
              onClick={closeMobileNav}
            >
              المنتجات
            </Link>
          </li>
        </ul>
      </MobileNavShell>

      <main className="section" style={{ paddingTop: 28 }}>
        <div className="container">
          <h1 className="section__title" style={{ marginTop: 0 }}>المنتجات</h1>
          <p className="section__text">
            ابحثي وصفّي حسب الاسم، المقاس، واللون — الألوان يعرّفها مالك المتجر من
            لوحة التحكم.
          </p>

          <div className="products-filters" dir="rtl">
            <div className="field field--wide">
              <label htmlFor="pq">بحث (في الاسم والوصف)</label>
              <input
                id="pq"
                name="q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="مثال: فستان، عباية..."
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="pname">اسم المنتج (ضمن الاسم فقط)</label>
              <input
                id="pname"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مطابقة لجزء من العنوان"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="pcat">التصنيف</label>
              <LuxuryListbox
                id="pcat"
                value={category}
                options={categoryOptions}
                onChange={(v) => setCategory(v as Category)}
              />
            </div>
            <div className="field">
              <label htmlFor="psize">المقاس</label>
              <LuxuryListbox
                id="psize"
                value={size}
                options={sizeOptions}
                onChange={setSize}
              />
            </div>
            <div className="field">
              <label htmlFor="pcol">اللون</label>
              <LuxuryListbox
                id="pcol"
                value={colorId}
                options={colorOptions}
                onChange={setColorId}
              />
            </div>
          </div>

          {err ? <p className="section__text" style={{ color: "#c77" }}>{err}</p> : null}
          {loading && !err ? (
            <p className="section__text">جارٍ التحميل…</p>
          ) : null}
          <div className="gallery">
            {!loading && !err && items.length === 0 ? (
              <p className="section__text" style={{ gridColumn: "1 / -1" }}>
                لا توجد نتائج. جرّبي تخفيف الفلتر.
              </p>
            ) : null}
            {items.map((item, idx) => {
              const selectedId =
                selectedVariantByProduct[item.id] ??
                defaultVariantIdForProduct(item);
              const orderEnabled = canOrderProduct(item, selectedId);
              return (
              <Reveal
                key={item.id}
                variant="zoom"
                delay={Math.min(idx * 60, 360)}
              >
                <article className="item product-card" data-cat={item.category}>
                  <div className="item__media item__media--product">
                    <ProductMediaCarousel
                      slides={toProductSlides(item)}
                      productLabel={item.title}
                    />
                  </div>
                  <div className="item__body">
                    <h3>{item.title}</h3>
                    {item.brandDesigner ? (
                      <p className="product-card__brand">
                        {item.brandDesigner.type === "BRAND"
                          ? "ماركة"
                          : "مصمّم"}
                        : {item.brandDesigner.nameAr}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="product-card__desc">{item.description}</p>
                    ) : null}
                    <p className="product-card__price">
                      {formatProductPriceDisplay(item.price, item.currency)}
                    </p>
                    {!item.inStock ? (
                      <p className="product-card__stock product-card__stock--out">
                        غير متوفر حاليًا
                      </p>
                    ) : null}
                    {item.colors.length > 0 ? (
                      <div className="product-card__chips" aria-label="الألوان">
                        {item.colors.map((c) => (
                          <span key={c.id} className="product-chip">
                            {c.hex ? (
                              <span
                                className="color-swatch"
                                style={{
                                  background: c.hex.startsWith("#")
                                    ? c.hex
                                    : `#${c.hex}`,
                                }}
                                title={c.label}
                              />
                            ) : null}
                            {c.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {displayVariantsForProduct(item).length > 0 ? (
                      <div
                        className="product-size-pills"
                        aria-label="المقاسات والتوفر"
                      >
                        {displayVariantsForProduct(item).map((v) => {
                          const sellable = isVariantSellable(v);
                          const selected = selectedId === v.id;
                          const cls = [
                            "product-size-pill",
                            selected ? "product-size-pill--selected" : "",
                            !sellable ? "product-size-pill--unavailable" : "",
                            !sellable && v.allowSpecialOrder
                              ? "product-size-pill--special"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ");
                          const title = !sellable
                            ? v.allowSpecialOrder
                              ? "غير متوفر حاليًا — طلب خاص عبر واتساب"
                              : "غير متوفر حاليًا"
                            : undefined;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              className={cls}
                              title={title}
                              onClick={() =>
                                setSelectedVariantByProduct((m) => ({
                                  ...m,
                                  [item.id]: v.id,
                                }))
                              }
                            >
                              <span>{v.size}</span>
                              {v.colorLabel ? (
                                <span style={{ opacity: 0.88 }}>
                                  {" "}
                                  · {v.colorLabel}
                                </span>
                              ) : null}
                              {!sellable && v.allowSpecialOrder ? (
                                <span className="product-size-pill__special">
                                  طلب خاص
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <p className="product-card__delivery">{PRODUCT_DELIVERY_NOTE}</p>
                    <button
                      className="btn btn--small btn--primary product-card__order-btn"
                      type="button"
                      disabled={!orderEnabled}
                      data-track="whatsapp_click"
                      data-product-id={item.id}
                      data-product-name={item.title}
                      data-whatsapp-template={productWhatsappTemplateKind(
                        item,
                        selectedId,
                      )}
                      onClick={() => orderProduct(item, selectedId)}
                    >
                      {orderButtonLabel(item, selectedId)}
                    </button>
                  </div>
                </article>
              </Reveal>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter
        socialUrls={socialUrls}
        whatsappLink={defaultWhatsapp}
        whatsappLinkTemplate="product_inquiry"
        whatsappLinkSource="products_footer"
      />
    </>
  );
}
