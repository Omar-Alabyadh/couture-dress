-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "colorId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "allowSpecialOrder" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_collectionItemId_sortOrder_idx" ON "ProductVariant"("collectionItemId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductVariant_collectionItemId_size_idx" ON "ProductVariant"("collectionItemId", "size");

-- CreateIndex
CREATE INDEX "ProductVariant_colorId_idx" ON "ProductVariant"("colorId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one variant per distinct trimmed size per product (dedupe duplicate entries in sizes[])
INSERT INTO "ProductVariant" ("id", "collectionItemId", "size", "colorId", "quantity", "isAvailable", "allowSpecialOrder", "sortOrder", "createdAt", "updatedAt")
SELECT
  ('clv_' || replace(gen_random_uuid()::text, '-', '')),
  g."collectionItemId",
  g."size",
  NULL,
  1,
  true,
  false,
  (ROW_NUMBER() OVER (PARTITION BY g."collectionItemId" ORDER BY g."sortKey") - 1)::int,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT
    ci."id" AS "collectionItemId",
    trim(both FROM u.s) AS "size",
    MIN((u.ord)::int) AS "sortKey"
  FROM "CollectionItem" ci
  CROSS JOIN LATERAL unnest(ci."sizes") WITH ORDINALITY AS u(s, ord)
  WHERE ci."sizes" IS NOT NULL
    AND cardinality(ci."sizes") > 0
    AND trim(both FROM u.s) <> ''
  GROUP BY ci."id", trim(both FROM u.s)
) AS g;
