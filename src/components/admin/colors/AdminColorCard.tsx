"use client";

import { AdminButton } from "@/components/admin/AdminPrimitives";

function normalizeHex(hex: string | null): string | null {
  if (!hex?.trim()) return null;
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(h)) return null;
  return h.length <= 6 ? h : h.slice(0, 6);
}

export function AdminColorCard({
  label,
  hex,
  archived,
  onArchive,
  onRestore,
}: {
  label: string;
  hex: string | null;
  archived: boolean;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const normalized = normalizeHex(hex);
  const swatchStyle = normalized
    ? { background: `#${normalized}` }
    : undefined;

  return (
    <article
      className={`admin-color-card${archived ? " admin-color-card--archived" : ""}`}
    >
      <div
        className="admin-color-card__swatch"
        style={swatchStyle}
        aria-hidden={!normalized}
      >
        {!normalized ? (
          <span className="admin-color-card__swatch-fallback">؟</span>
        ) : null}
        <span className="admin-color-card__swatch-ring" aria-hidden />
      </div>
      <div className="admin-color-card__body">
        <h3 className="admin-color-card__label">
          {label}
          {archived ? <span className="admin-color-card__tag">مؤرشف</span> : null}
        </h3>
        <p className="admin-color-card__hex" dir="ltr">
          {normalized ? `#${normalized}` : "بدون كود لون"}
        </p>
        <div className="admin-color-card__actions">
          {archived ? (
            <AdminButton type="button" variant="secondary" onClick={onRestore}>
              استرجاع
            </AdminButton>
          ) : (
            <AdminButton type="button" variant="ghost" onClick={onArchive}>
              أرشفة
            </AdminButton>
          )}
        </div>
      </div>
    </article>
  );
}
