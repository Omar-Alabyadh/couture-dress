# Media Hardening Plan (Phase 6.4)

Context: Media backend (6.1), Media Library UI (6.2), and MediaPicker integration (6.3) are live. URL-based CMS fields remain the source of truth for public pages until a future FK phase.

## Phase 6.4A — Implemented

Safe polish **without Prisma schema changes**.

### Scope delivered

1. **Orphan media detection (computed scan)**
   - `mediaUsageScanService` scans normalized URLs in:
     - `ProductImage.url`
     - `CollectionItem.imageUrl`
     - `BrandDesigner.logoUrl`
     - `Testimonial.imageUrl`
     - Landing JSON `heroBgImage` only
   - `GET /api/admin/media/[id]/usage` (OWNER)
   - Archive confirm in media library shows usage warning (does not block archive)

2. **Security**
   - EXIF/metadata stripped via sharp re-encode after `rotate()`
   - In-memory upload rate limit: 30 uploads/hour/user on `POST /api/admin/media` (best-effort on serverless)
   - 429 Arabic error when exceeded

3. **Stats**
   - `GET /api/admin/media/stats` (OWNER): active/archived counts, total active bytes, counts by usageType/folder, latest 5 uploads
   - Compact stats strip on `/admin/manage/media`

4. **MediaPicker usageType sync**
   - When picker has `defaultUsageType` and asset is `GENERAL`, PATCH to target usageType/folder before selection
   - Non-GENERAL assets are not overwritten
   - Warning toast if PATCH fails; selection still proceeds

5. **Product media UX**
   - «إضافة صورة من المكتبة» adds row + opens picker
   - Fills url/alt; sets primary when first valid image
   - Picker empty state: filtered vs global messages + «عرض كل الوسائط النشطة»

### APIs added

| Method | Route |
|--------|--------|
| GET | `/api/admin/media/[id]/usage` |
| GET | `/api/admin/media/stats` |

### Files (representative)

- `src/server/services/mediaUsageScanService.ts`
- `src/server/services/mediaStatsService.ts`
- `src/lib/media/normalize-url.ts`
- `src/lib/api/media-upload-rate-limit.ts`
- `src/components/admin/media/MediaLibraryStatsStrip.tsx`
- Updates to `MediaPicker`, media library page, product admin

---

## Phase 6.4B — Deferred (small schema)

- `MediaAsset.contentHash` + duplicate warning on upload
- `MediaAsset.archivedAt` for retention policy
- Optional usage scan cache

**Migration:** yes, when started.

---

## Phase 6.4C — Deferred (advanced)

- Thumbnails and responsive variants (`MediaVariant` or variant paths)
- AVIF second encode
- `next/image` on public site
- Blur placeholders / LQIP
- Hard-delete cron for archived + unreferenced assets
- `mediaAssetId` FK on `ProductImage` and related models
- Multi-select MediaPicker
- Product card hover second image

**Migration:** likely when variants or FKs are introduced.

---

## Explicitly NOT implemented (6.4A)

- Prisma schema changes
- `mediaAssetId` foreign keys
- Thumbnails / AVIF / `next/image`
- `MediaVariant` table
- Hard delete from Supabase Storage
- Cron jobs
- Upstash/Redis rate limiting
- Full landing JSON image walker (only `heroBgImage`)
- Removing manual URL inputs
- Public landing layout changes
- Blocking archive when media is in use (warn only)

---

## Validation checklist (6.4A)

- [ ] Upload JPEG/PNG/WebP still works
- [ ] Stats strip matches library counts
- [ ] Archive used asset → warning with reference count
- [ ] Archive unused asset → safe message
- [ ] Pick GENERAL asset in product picker → becomes `PRODUCT_IMAGE`
- [ ] «إضافة صورة من المكتبة» flow works
- [ ] Public product/brand/testimonial images unchanged
- [ ] 31st upload in one hour → 429 (optional stress test)

## Rollback

Revert commit; no database migration to roll back. In-memory rate limit resets on cold start.
