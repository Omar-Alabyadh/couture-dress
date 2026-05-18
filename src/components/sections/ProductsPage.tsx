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

function uniqueVariantColors(item: CollectionItemView): string[] {
  const set = new Set<string>();
  for (const v of displayVariantsForProduct(item)) {
    const label = v.colorLabel?.trim();
    if (label) set.add(label);
  }
  for (const c of item.colors) {
    if (c.label.trim()) set.add(c.label.trim());
  }
  return Array.from(set);
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

  function orderProduct(item: CollectionItemView, variant: ProductVariantView | null) {
    const v = variant;
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
            تصفّحي تشكيلتنا واختاري المقاس واللون المناسبين — ثم اطلبي عبر واتساب
            بسهولة.
          </p>

          <div className="products-filters" dir="rtl">
            <div className="field field--wide">
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
              const selection = selectionByProduct[item.id];
              const variant = resolveVariantForSelection(item, selection);
              const selectedId =
                variant?.id ?? defaultVariantIdForProduct(item);
              const orderEnabled = canOrderProduct(item, selectedId);
              const fullyUnavailable =
                !item.inStock && !productHasSpecialOrderOption(item);
              const colorOptions = uniqueVariantColors(item);
              const sizeOptions = uniqueVariantSizes(item);
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
                    <p className="product-card__price">{priceLine(item)}</p>
                    {colorOptions.length > 0 ? (
                      <div className="product-card__picker" aria-label="اختيار اللون">
                        <span className="product-card__picker-label">اللون</span>
                        <div className="product-card__pills">
                          {colorOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`product-choice-pill${
                                selection?.color === c
                                  ? " product-choice-pill--selected"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectionByProduct((m) => ({
                                  ...m,
                                  [item.id]: {
                                    size: m[item.id]?.size ?? "",
                                    color: c,
                                  },
                                }))
                              }
                            >
                              {c}
                            </button>
                          ))}
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
                              {s}
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
    </>
  );
}
