"use client";

/* eslint-disable @next/next/no-img-element -- match marketing site */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import type { CollectionItemView, CollectionCategory } from "@/lib/types/collection";
import { siteConfig, type PublicSocialUrls } from "@/lib/config/site";
import { buildWhatsappLink } from "@/lib/whatsapp";
import Reveal from "@/components/motion/Reveal";
import { useStickyHeader } from "@/components/motion/useStickyHeader";
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
    () => buildWhatsappLink(`أريد الاستفسار عن موديلات ${siteConfig.shopName}.`),
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

  function order(title: string) {
    const message = `مرحباً، أريد طلب/الاستفسار عن: ${title} من ${siteConfig.shopName}.`;
    window.open(buildWhatsappLink(message), "_blank", "noopener,noreferrer");
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
            className="nav__toggle"
            type="button"
            aria-label="فتح القائمة"
            onClick={() => setMobileNavOpen((c) => !c)}
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
        <Link href="/#about" onClick={() => setMobileNavOpen(false)}>من نحن</Link>
        <Link href="/#collection" onClick={() => setMobileNavOpen(false)}>المجموعة</Link>
        <Link href="/#features" onClick={() => setMobileNavOpen(false)}>مميزاتنا</Link>
        <Link href="/#contact" onClick={() => setMobileNavOpen(false)}>تواصل</Link>
      </div>

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
            {items.map((item, idx) => (
              <Reveal
                key={item.id}
                variant="zoom"
                delay={Math.min(idx * 60, 360)}
              >
                <article className="item" data-cat={item.category}>
                  <div className="item__media">
                    <img src={item.imageUrl} alt={item.imageAlt} loading="lazy" />
                  </div>
                  <div className="item__body">
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.sizes.length > 0 || item.colors.length > 0 ? (
                      <p
                        className="item__meta muted"
                        style={{ fontSize: 13, margin: "0 0 6px" }}
                      >
                        {item.sizes.length > 0 ? (
                          <span>المقاسات: {item.sizes.join("، ")}</span>
                        ) : null}
                        {item.sizes.length > 0 && item.colors.length > 0 ? " · " : null}
                        {item.colors.length > 0 ? (
                          <span>
                            {item.colors.map((c) => (
                              <span key={c.id}>
                                {c.hex ? (
                                  <span
                                    className="color-swatch"
                                    style={{ background: c.hex }}
                                    title={c.label}
                                  />
                                ) : null}
                                {c.label}{" "}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    <button
                      className="btn btn--small btn--primary item__btn"
                      type="button"
                      onClick={() => order(item.title)}
                    >
                      اطلبي عبر واتساب
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter
        socialUrls={socialUrls}
        whatsappLink={defaultWhatsapp}
      />
    </>
  );
}
