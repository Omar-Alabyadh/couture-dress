-- CreateEnum
CREATE TYPE "SizeOptionType" AS ENUM ('STANDARD', 'LETTER', 'NUMBER');

-- CreateTable
CREATE TABLE "SizeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "SizeOptionType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SizeOption_type_label_key" ON "SizeOption"("type", "label");

-- CreateIndex
CREATE INDEX "SizeOption_archivedAt_type_sortOrder_idx" ON "SizeOption"("archivedAt", "type", "sortOrder");
