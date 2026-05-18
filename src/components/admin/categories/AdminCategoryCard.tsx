"use client";

import { AdminButton } from "@/components/admin/AdminPrimitives";

export function AdminCategoryCard({
  nameAr,
  slug,
  descriptionAr,
  sortOrder,
  archived,
  onArchive,
  onRestore,
}: {
  nameAr: string;
  slug: string;
  descriptionAr: string | null;
  sortOrder: number;
  archived: boolean;
  onArchive: () => void;
  onRestore: () => void;
}) {
  return (
    <article
      className={`admin-category-card${archived ? " admin-category-card--archived" : ""}`}
    >
      <div className="admin-category-card__accent" aria-hidden />
      <div className="admin-category-card__body">
        <div className="admin-category-card__head">
          <h3 className="admin-category-card__title">{nameAr}</h3>
          {archived ? (
            <span className="admin-category-card__tag">مؤرشف</span>
          ) : null}
        </div>
        <p className="admin-category-card__slug" dir="ltr">
          {slug}
        </p>
        {descriptionAr ? (
          <p className="admin-category-card__desc">{descriptionAr}</p>
        ) : (
          <p className="admin-category-card__desc admin-category-card__desc--empty">
            بدون وصف
          </p>
        )}
        <p className="admin-category-card__order">الترتيب: {sortOrder}</p>
        <div className="admin-category-card__actions">
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
