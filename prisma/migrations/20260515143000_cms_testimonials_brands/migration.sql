-- CreateEnum
CREATE TYPE "BrandDesignerType" AS ENUM ('BRAND', 'DESIGNER');

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandDesigner" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" "BrandDesignerType" NOT NULL,
    "logoUrl" TEXT,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandDesigner_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN "brandDesignerId" TEXT;

-- CreateIndex
CREATE INDEX "Testimonial_deletedAt_isPublished_sortOrder_idx" ON "Testimonial"("deletedAt", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "BrandDesigner_deletedAt_sortOrder_idx" ON "BrandDesigner"("deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionItem_brandDesignerId_idx" ON "CollectionItem"("brandDesignerId");

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_brandDesignerId_fkey" FOREIGN KEY ("brandDesignerId") REFERENCES "BrandDesigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
