import sharp from "sharp";
import type { MediaUsageType } from "@/generated/prisma/client";
import type { ProcessedImage } from "./types";

const WEBP_QUALITY = 82;
const MAX_PIXEL_EDGE = 8000;

const LONG_EDGE_BY_USAGE: Record<MediaUsageType, number> = {
  PRODUCT_IMAGE: 1600,
  BRAND_LOGO: 800,
  TESTIMONIAL_AVATAR: 800,
  LANDING_IMAGE: 2400,
  GENERAL: 1600,
};

export type ImageProcessErrorCode = "INVALID" | "TOO_LARGE";

export class ImageProcessError extends Error {
  code: ImageProcessErrorCode;
  constructor(code: ImageProcessErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ImageProcessError";
  }
}

export async function processImageForUpload(
  input: Buffer,
  usageType: MediaUsageType,
  outputBasename: string,
): Promise<ProcessedImage> {
  let pipeline = sharp(input, { failOn: "error" }).rotate();

  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w <= 0 || h <= 0) {
    throw new ImageProcessError("INVALID", "تعذر قراءة أبعاد الصورة.");
  }
  if (w > MAX_PIXEL_EDGE || h > MAX_PIXEL_EDGE) {
    throw new ImageProcessError(
      "TOO_LARGE",
      "أبعاد الصورة كبيرة جدًا.",
    );
  }

  const longEdge = LONG_EDGE_BY_USAGE[usageType] ?? 1600;
  pipeline = pipeline.resize({
    width: longEdge,
    height: longEdge,
    fit: "inside",
    withoutEnlargement: true,
  });

  const buffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  const outMeta = await sharp(buffer).metadata();
  const width = outMeta.width ?? w;
  const height = outMeta.height ?? h;

  const base = outputBasename.replace(/\.[^.]+$/, "").slice(0, 120) || "upload";
  const filename = `${base}.webp`;

  return {
    buffer,
    mimeType: "image/webp",
    width,
    height,
    sizeBytes: buffer.length,
    filename,
  };
}
