-- AlterTable: add percentage discount fields to CollectionItem
ALTER TABLE "CollectionItem" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discountActive" BOOLEAN NOT NULL DEFAULT false;
