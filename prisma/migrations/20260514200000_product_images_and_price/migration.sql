-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN "price" DECIMAL(12,2),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'LYD';

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_collectionItemId_sortOrder_idx" ON "ProductImage"("collectionItemId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one primary ProductImage per existing row from legacy imageUrl
INSERT INTO "ProductImage" ("id", "collectionItemId", "url", "alt", "isPrimary", "sortOrder", "createdAt")
SELECT
    ('pimg_' || replace(gen_random_uuid()::text, '-', '')),
    ci."id",
    ci."imageUrl",
    COALESCE(NULLIF(TRIM(ci."titleEn"), ''), ci."titleAr"),
    true,
    0,
    CURRENT_TIMESTAMP
FROM "CollectionItem" ci;
