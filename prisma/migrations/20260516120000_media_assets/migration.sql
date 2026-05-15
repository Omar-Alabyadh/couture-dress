-- CreateEnum
CREATE TYPE "MediaUsageType" AS ENUM ('PRODUCT_IMAGE', 'BRAND_LOGO', 'TESTIMONIAL_AVATAR', 'LANDING_IMAGE', 'GENERAL');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('SUPABASE_STORAGE');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "folder" TEXT NOT NULL,
    "usageType" "MediaUsageType" NOT NULL DEFAULT 'GENERAL',
    "provider" "MediaProvider" NOT NULL DEFAULT 'SUPABASE_STORAGE',
    "bucket" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_path_key" ON "MediaAsset"("path");

-- CreateIndex
CREATE INDEX "MediaAsset_isArchived_folder_createdAt_idx" ON "MediaAsset"("isArchived", "folder", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_usageType_isArchived_idx" ON "MediaAsset"("usageType", "isArchived");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_createdById_idx" ON "MediaAsset"("createdById");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
