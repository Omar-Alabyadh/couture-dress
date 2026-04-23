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
