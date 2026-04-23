# Couture Dress Architecture (Phase 1)

## Structure

- `src/app/(site)` public website routes.
- `src/app/(dashboard)/admin` dashboard/CMS placeholder routes.
- `src/app/api` backend API surface for CRUD expansion.
- `src/components` presentation and feature UI components.
- `src/lib` shared config/helpers used by UI and API.
- `src/server` backend layers (`db -> repositories -> services`).
- `prisma` database schema and migrations.

## Layering Rules

- UI components do not access Prisma directly.
- API routes call services, not repositories directly when business rules exist.
- Repositories are the only layer that talks to Prisma models.

## Bilingual Comments Policy

- AR: التعليقات تُكتب فقط عند منطق غير بديهي أو قرار معماري.
- EN: Comments are added only for non-obvious logic or architectural decisions.
- Keep comments short and intent-focused, never line-by-line narration.

## Static assets (images)

- AR: مصدر الصور الموحّد هو `assets/` في جذر المشروع (للموقع الثابت `index.html`).
- EN: Canonical image source is repo-root `assets/` (legacy static `index.html`).
- AR: سكربت `npm run sync:assets` ينسخ الملفات إلى `public/assets` قبل `dev/build`.
- EN: `npm run sync:assets` copies files into `public/assets` before `dev/build` (`predev` / `prebuild`).

## Collection content (DB)

- AR: واجهة المجموعة تقرأ من PostgreSQL عبر `getPublicCollectionItemsForHome()` في الصفحة الرئيسية.
- EN: The gallery reads PostgreSQL via `getPublicCollectionItemsForHome()` on the home page.
- AR: بذرة تجريبية: `npx prisma db seed` بعد تهيئة `DATABASE_URL` وتطبيق الترحيلات.
- EN: Demo seed: `npx prisma db seed` after `DATABASE_URL` is set and migrations are applied.
