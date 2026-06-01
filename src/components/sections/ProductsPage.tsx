"use client";

/* eslint-disable @next/next/no-img-element -- match marketing site */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import type {
  CollectionItemView,
  CollectionCategory,
  ProductVariantView,
} from "@/lib/types/collection";
import { isVariantSellable } from "@/lib/types/collection";
import { formatPublicSizeLabel } from "@/lib/sizes/display-size";
import type { PublicSocialUrls } from "@/lib/config/site";
import type { WhatsappTemplateKind } from "@/lib/communication/whatsapp";
import {
  buildProductWhatsappBody,
  buildSiteWhatsappUrl,
  buildWhatsappMessage,
} from "@/lib/communication/whatsapp";
import { getShopName } from "@/lib/customer-service";
import { formatProductPriceDisplay } from "@/lib/product-price";
import { resolveProductDiscount } from "@/lib/products/discount";
import {
  PRODUCT_DELIVERY_INTERNATIONAL,
  PRODUCT_DELIVERY_LIBYA,
} from "@/lib/config/product-display";
import { ProductMediaCarousel } from "@/components/products/ProductMediaCarousel";
import type { ProductSlide } from "@/components/products/ProductMediaCarousel";
import Reveal from "@/components/motion/Reveal";
import { useStickyHeader } from "@/components/motion/useStickyHeader";
import { MobileNavShell } from "@/components/layout/MobileNavShell";
import SiteFooter from "@/components/sections/SiteFooter";
import { LuxuryListbox } from "@/components/ui/LuxuryListbox";

type ColorOption = { id: string; label: string; hex: string | null };

type Category = "all" | string;

type SelectionState = { size: string; color: string };

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
  size: string;
  colorId: string;
  category: Category;
}) {
  const u = new URLSearchParams();
  if (p.q.trim()) u.set("q", p.q.trim());
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

type ColorChip = { label: string; hex: string | null };

/**
 * Colors shown on the public card — derived from the product's variant rows
 * (single source of truth), enriched with each color's hex for the swatch.
 * Falls back to the product `colors` relation for legacy rows without variants.
 */
function uniqueVariantColors(item: CollectionItemView): ColorChip[] {
  const colorById = new Map(item.colors.map((c) => [c.id, c]));
  const hexByLabel = new Map(
    item.colors.map((c) => [c.label.trim(), c.hex] as const),
  );
  const out: ColorChip[] = [];
  const seen = new Set<string>();
  for (const v of displayVariantsForProduct(item)) {
    const fromId = v.colorId ? colorById.get(v.colorId) : undefined;
    const label = (fromId?.label ?? v.colorLabel ?? "").trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, hex: fromId?.hex ?? hexByLabel.get(label) ?? null });
  }
  for (const c of item.colors) {
    const label = c.label.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, hex: c.hex });
  }
  return out;
}

/** Normalize a stored hex to a safe CSS color, or null when unusable. */
function safeSwatchColor(hex: string | null): string | null {
  if (!hex) return null;
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(h)) return null;
  return `#${h.slice(0, 6)}`;
}

function uniqueVariantSizes(item: CollectionItemView): string[] {
  const set = new Set<string>();
  for (const v of displayVariantsForProduct(item)) {
    const s = v.size.trim();
    if (s) set.add(s);
  }
  return Array.from(set);
}

function resolveVariantForSelection(
  item: CollectionItemView,
  selection: SelectionState | undefined,
): ProductVariantView | null {
  const rows = displayVariantsForProduct(item);
  if (rows.length === 0) return null;
  const size = selection?.size?.trim() ?? "";
  const color = selection?.color?.trim() ?? "";
  if (size || color) {
    const match = rows.find((v) => {
      const sizeOk = !size || v.size.trim() === size;
      const colorOk =
        !color ||
        (v.colorLabel?.trim() ?? "") === color ||
        item.colors.find((c) => c.id === v.colorId)?.label.trim() === color;
      return sizeOk && colorOk;
    });
    if (match) return match;
  }
  return rows.find(isVariantSellable) ?? rows[0] ?? null;
}

function priceLine(item: CollectionItemView): string {
  if (item.price != null && item.price !== "") {
    return formatProductPriceDisplay(item.price, item.currency);
  }
  return "تواصلي لمعرفة السعر";
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
  const [selectionByProduct, setSelectionByProduct] = useState<
    Record<string, SelectionState>
  >({});
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    {},
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState<Category>("all");
  const [draftSize, setDraftSize] = useState("");
  const [draftColorId, setDraftColorId] = useState("");
  const mobileFiltersPanelRef = useRef<HTMLDivElement>(null);

  const closeMobileFilters = useCallback(() => setMobileFiltersOpen(false), []);

  const openMobileFilters = useCallback(() => {
    setDraftCategory(category);
    setDraftSize(size);
    setDraftColorId(colorId);
    setMobileFiltersOpen(true);
  }, [category, size, colorId]);

  const applyMobileFilters = useCallback(() => {
    setCategory(draftCategory);
    setSize(draftSize);
    setColorId(draftColorId);
    setMobileFiltersOpen(false);
  }, [draftCategory, draftSize, draftColorId]);

  const resetMobileFilterDraft = useCallback(() => {
    setDraftCategory("all");
    setDraftSize("");
    setDraftColorId("");
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (category !== "all") n += 1;
    if (size) n += 1;
    if (colorId) n += 1;
    return n;
  }, [category, size, colorId]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileFilters();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileFiltersOpen, closeMobileFilters]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const t = requestAnimationFrame(() => {
      mobileFiltersPanelRef.current
        ?.querySelector<HTMLElement>(".products-mobile-filter-sheet__close")
        ?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const qs = buildQuery({
      q: debouncedQ,
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
  }, [debouncedQ, size, colorId, category]);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void fetch("/api/public/categories", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { data?: { slug: string; nameAr: string }[] } | null) => {
          if (!j?.data) return;
          const map: Record<string, string> = {};
          for (const c of j.data) map[c.slug] = c.nameAr;
          setCategoryLabels(map);
        })
        .catch(() => {});
    });
  }, []);

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
    [categoryLabels],
  );

  const sizeOptions = useMemo(
    () => [
      { value: "", label: "— أي مقاس —" },
      ...sizes.map((z) => ({ value: z, label: formatPublicSizeLabel(z) })),
    ],
    [sizes],
  );

  const colorOptions = useMemo(
    () => [
      { value: "", label: "— أي لون —" },
      ...colors.map((c) => ({
        value: c.id,
        label: c.label.trim() || c.id,
      })),
    ],
    [colors],
  );

  function orderProduct(item: CollectionItemView, variant: ProductVariantView | null) {
    const v = variant;
    const sellable = v ? isVariantSellable(v) : false;
    const special = Boolean(v && !sellable && v.allowSpecialOrder);
    const unavailableNoSpecial = Boolean(v && !sellable && !v.allowSpecialOrder);
    const discount = resolveProductDiscount({
      price: item.price,
      discountPercent: item.discountPercent,
      discountActive: item.discountActive,
    });
    const message = buildProductWhatsappBody({
      productTitle: item.title,
      price: discount.finalPrice,
      currency: item.currency,
      discountPercent: discount.hasDiscount ? discount.percent : null,
      originalPrice: discount.hasDiscount ? discount.originalPrice : null,
      selectedSize: v?.size ?? null,
      selectedColorLabel: v?.colorLabel ?? null,
      specialOrderMode: special,
      unavailableNoSpecial: unavailableNoSpecial && !special,
    });
    window.open(buildSiteWhatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="products-page">
      <header ref={headerRef} className="topbar products-page__topbar">
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

      <main className="section products-page__main">
        <div className="container">
          <h1 className="section__title" style={{ marginTop: 0 }}>المنتجات</h1>
          <p className="section__text">
            تصفّحي تشكيلتنا واختاري المقاس واللون المناسبين — ثم اطلبي عبر واتساب
            بسهولة.
          </p>

          <div className="products-filters" dir="rtl">
            <div className="products-filters__bar">
              <div className="field field--wide products-filters__search">
                <label htmlFor="pq">بحث</label>
                <input
                  id="pq"
                  name="q"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحثي بالاسم أو الوصف…"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="products-filters__open-btn"
                aria-expanded={mobileFiltersOpen}
                aria-controls="productsMobileFilters"
                onClick={openMobileFilters}
              >
                <span className="products-filters__open-btn-label">الفلاتر</span>
                {activeFilterCount > 0 ? (
                  <span
                    className="products-filters__open-btn-badge"
                    aria-label={`${activeFilterCount} فلاتر مفعّلة`}
                  >
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
            <div className="products-filters__desktop-fields">
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
          </div>

          <div
            className={`products-mobile-filter-sheet${
              mobileFiltersOpen ? " products-mobile-filter-sheet--open" : ""
            }`}
            aria-hidden={!mobileFiltersOpen}
          >
            <button
              type="button"
              className="products-mobile-filter-sheet__backdrop"
              tabIndex={-1}
              aria-hidden="true"
              onClick={closeMobileFilters}
            />
            <div
              ref={mobileFiltersPanelRef}
              id="productsMobileFilters"
              className="products-mobile-filter-sheet__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="productsMobileFiltersTitle"
              dir="rtl"
            >
              <header className="products-mobile-filter-sheet__head">
                <h2
                  id="productsMobileFiltersTitle"
                  className="products-mobile-filter-sheet__title"
                >
                  الفلاتر
                </h2>
                <button
                  type="button"
                  className="products-mobile-filter-sheet__close"
                  aria-label="إغلاق الفلاتر"
                  onClick={closeMobileFilters}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </header>
              <div className="products-mobile-filter-sheet__body products-filters">
                <div className="field">
                  <label htmlFor="pcat-mobile">التصنيف</label>
                  <LuxuryListbox
                    id="pcat-mobile"
                    value={draftCategory}
                    options={categoryOptions}
                    onChange={(v) => setDraftCategory(v as Category)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="psize-mobile">المقاس</label>
                  <LuxuryListbox
                    id="psize-mobile"
                    value={draftSize}
                    options={sizeOptions}
                    onChange={setDraftSize}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pcol-mobile">اللون</label>
                  <LuxuryListbox
                    id="pcol-mobile"
                    value={draftColorId}
                    options={colorOptions}
                    onChange={setDraftColorId}
                  />
                </div>
              </div>
              <footer className="products-mobile-filter-sheet__footer">
                <button
                  type="button"
                  className="products-mobile-filter-sheet__reset"
                  onClick={resetMobileFilterDraft}
                >
                  إعادة تعيين
                </button>
                <button
                  type="button"
                  className="products-mobile-filter-sheet__apply"
                  onClick={applyMobileFilters}
                >
                  تطبيق الفلاتر
                </button>
              </footer>
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
              const selection = selectionByProduct[item.id];
              const variant = resolveVariantForSelection(item, selection);
              const selectedId =
                variant?.id ?? defaultVariantIdForProduct(item);
              const orderEnabled = canOrderProduct(item, selectedId);
              const fullyUnavailable =
                !item.inStock && !productHasSpecialOrderOption(item);
              const colorOptions = uniqueVariantColors(item);
              const sizeOptions = uniqueVariantSizes(item);
              const cardDiscount = resolveProductDiscount({
                price: item.price,
                discountPercent: item.discountPercent,
                discountActive: item.discountActive,
              });
              return (
              <Reveal
                key={item.id}
                variant="zoom"
                delay={Math.min(idx * 60, 360)}
              >
                <article
                  className={`item product-card${fullyUnavailable ? " product-card--unavailable" : ""}`}
                  data-cat={item.category}
                >
                  <div className="item__media item__media--product">
                    <ProductMediaCarousel
                      slides={toProductSlides(item)}
                      productLabel={item.title}
                    />
                    {fullyUnavailable ? (
                      <span className="product-card__overlay-badge">غير متوفر</span>
                    ) : cardDiscount.hasDiscount ? (
                      <span className="product-card__sale-badge">
                        خصم {cardDiscount.percent}%
                      </span>
                    ) : null}
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
                    {cardDiscount.hasDiscount ? (
                      <div className="product-card__price product-card__price--discounted">
                        <span className="product-card__price-old">
                          {formatProductPriceDisplay(
                            cardDiscount.originalPrice,
                            item.currency,
                          )}
                        </span>
                        <span className="product-card__price-new">
                          {formatProductPriceDisplay(
                            cardDiscount.finalPrice,
                            item.currency,
                          )}
                        </span>
                        <span className="product-card__discount-badge">
                          خصم {cardDiscount.percent}%
                        </span>
                      </div>
                    ) : (
                      <p className="product-card__price">{priceLine(item)}</p>
                    )}
                    {colorOptions.length > 0 ? (
                      <div
                        className="product-card__picker"
                        aria-label={
                          colorOptions.length === 1
                            ? "اللون المتوفر"
                            : "الألوان المتوفرة"
                        }
                      >
                        <span className="product-card__picker-label">
                          {colorOptions.length === 1
                            ? "اللون المتوفر"
                            : "الألوان المتوفرة"}
                        </span>
                        <div className="product-card__pills">
                          {colorOptions.map((c) => {
                            const swatch = safeSwatchColor(c.hex);
                            return (
                              <button
                                key={c.label}
                                type="button"
                                className={`product-choice-pill product-choice-pill--color${
                                  selection?.color === c.label
                                    ? " product-choice-pill--selected"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSelectionByProduct((m) => ({
                                    ...m,
                                    [item.id]: {
                                      size: m[item.id]?.size ?? "",
                                      color: c.label,
                                    },
                                  }))
                                }
                              >
                                <span
                                  className="product-choice-pill__swatch"
                                  style={
                                    swatch ? { background: swatch } : undefined
                                  }
                                  aria-hidden
                                />
                                <span className="product-choice-pill__label">
                                  {c.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {sizeOptions.length > 0 ? (
                      <div className="product-card__picker" aria-label="اختيار المقاس">
                        <span className="product-card__picker-label">المقاس</span>
                        <div className="product-card__pills">
                          {sizeOptions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`product-choice-pill${
                                selection?.size === s
                                  ? " product-choice-pill--selected"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectionByProduct((m) => ({
                                  ...m,
                                  [item.id]: {
                                    color: m[item.id]?.color ?? "",
                                    size: s,
                                  },
                                }))
                              }
                            >
                              {formatPublicSizeLabel(s)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <p className="product-card__delivery">{PRODUCT_DELIVERY_LIBYA}</p>
                    <p className="product-card__delivery product-card__delivery--intl">
                      {PRODUCT_DELIVERY_INTERNATIONAL}
                    </p>
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
                      onClick={() => orderProduct(item, variant)}
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
    </div>
  );
}
