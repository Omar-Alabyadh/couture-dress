import type { MediaProvider, MediaUsageType } from "@/generated/prisma/client";

export type MediaAssetDto = {
  id: string;
  path: string;
  url: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  usageType: MediaUsageType;
  provider: MediaProvider;
  bucket: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
};

export type MediaListFilters = {
  folder?: string;
  usageType?: MediaUsageType;
  archived?: "false" | "true" | "all";
  q?: string;
  limit?: number;
  cursor?: string;
};

export type MediaListResult = {
  data: MediaAssetDto[];
  nextCursor: string | null;
};

export type MediaUploadInput = {
  file: File;
  usageType?: MediaUsageType;
  folder?: string;
  alt?: string | null;
};

export type MediaUpdateInput = {
  alt?: string | null;
  folder?: string;
  usageType?: MediaUsageType;
  isArchived?: boolean;
};

export type ProcessedImage = {
  buffer: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  filename: string;
};
