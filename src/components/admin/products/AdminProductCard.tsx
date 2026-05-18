"use client";

import { useState } from "react";
import { AdminButton } from "@/components/admin/AdminPrimitives";
import { ProductStatusBadge } from "@/components/admin/ProductStatusBadge";
import type { ProductAdminStatus } from "@/lib/admin/product-status";

type AdminProductCardProps = {
  title: string;
  categoryLabel: string;
  status: ProductAdminStatus;
  priceLabel: string;
  imageSrc: string;
  sizes: string[];
  colors: string[];
  onEdit: () => void;
  onArchive: () => void;
};

function ColorDots({ colors }: { colors: string[] }) {
  if (colors.length === 0) {
    return <span className="admin-product-card__meta-empty">—</span>;
  }
  return (
    <ul className="admin-product-card__chips" aria-label="الألوان">
      {colors.slice(0, 5).map((c) => (
        <li key={c} className="admin-product-card__chip">
          {c}
        </li>
      ))}
      {colors.length > 5 ? (
        <li className="admin-product-card__chip admin-product-card__chip--more">
          +{colors.length - 5}
        </li>
      ) : null}
    </ul>
  );
}

function SizeChips({ sizes }: { sizes: string[] }) {
  if (sizes.length === 0) {
    return <span className="admin-product-card__meta-empty">—</span>;
  }
  return (
    <ul className="admin-product-card__chips" aria-label="المقاسات">
      {sizes.slice(0, 6).map((s) => (
        <li key={s} className="admin-product-card__chip admin-product-card__chip--size">
          {s}
        </li>
      ))}
      {sizes.length > 6 ? (
        <li className="admin-product-card__chip admin-product-card__chip--more">
          +{sizes.length - 6}
        </li>
      ) : null}
    </ul>
  );
}

export function AdminProductCard({
  title,
  categoryLabel,
  status,
  priceLabel,
  imageSrc,
  sizes,
  colors,
  onEdit,
  onArchive,
}: AdminProductCardProps) {
  const trimmed = imageSrc.trim();
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = Boolean(trimmed && failedFor === trimmed);

  return (
    <article className="admin-product-card">
      <div className="admin-product-card__media">
        {trimmed && !failed ? (
          /* eslint-disable-next-line @next/next/no-img-element -- admin product card */
          <img
            src={trimmed}
            alt=""
            loading="lazy"
            onError={() => setFailedFor(trimmed)}
          />
        ) : (
          <span className="admin-product-card__media-placeholder">بدون صورة</span>
        )}
        <span className="admin-product-card__media-glow" aria-hidden />
      </div>
      <div className="admin-product-card__body">
        <div className="admin-product-card__head">
          <h3 className="admin-product-card__title">{title}</h3>
          <ProductStatusBadge status={status} />
        </div>
        <p className="admin-product-card__category">{categoryLabel}</p>
        <p className="admin-product-card__price">{priceLabel}</p>
        <div className="admin-product-card__meta">
          <div className="admin-product-card__meta-block">
            <span className="admin-product-card__meta-label">المقاسات</span>
            <SizeChips sizes={sizes} />
          </div>
          <div className="admin-product-card__meta-block">
            <span className="admin-product-card__meta-label">الألوان</span>
            <ColorDots colors={colors} />
          </div>
        </div>
        <div className="admin-product-card__actions">
          <AdminButton type="button" variant="secondary" onClick={onEdit}>
            تعديل
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onArchive}>
            أرشفة
          </AdminButton>
        </div>
      </div>
    </article>
  );
}