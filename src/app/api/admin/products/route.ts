import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { listCollectionForAdmin } from "@/server/repositories/contentRepository";
import { isRecord } from "@/lib/validation/record";
import {
  isSafeProductImageUrl,
  isValidOptionalDescription,
  isValidOptionalTitleEn,
  isValidTitleAr,
  normalizeColorIds,
  normalizeProductSizes,
} from "@/lib/validation/product-input";

const CATEGORIES = new Set(["dresses", "abayas", "casual", "accessories"]);

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listCollectionForAdmin();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}

type CreateBody = {
  titleAr: string;
  titleEn?: string | null;
  description?: string | null;
  imageUrl: string;
  category: string;
  isPublished?: boolean;
  sizes?: string[];
  colorIds?: string[];
};

function parseCreate(body: unknown): CreateBody | null {
  if (!isRecord(body)) return null;
  const titleAr = String(body.titleAr ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const category = String(body.category ?? "").trim();
  if (!isValidTitleAr(titleAr)) return null;
  if (!isSafeProductImageUrl(imageUrl)) return null;
  if (!CATEGORIES.has(category)) return null;
  const rawSizes = Array.isArray(body.sizes)
    ? (body.sizes as unknown[]).map((s) => String(s).trim()).filter(Boolean)
    : [];
  const sizes = normalizeProductSizes(rawSizes);
  if (sizes == null) return null;
  const rawColorIds = Array.isArray(body.colorIds)
    ? (body.colorIds as unknown[]).map((c) => String(c).trim()).filter(Boolean)
    : [];
  const colorIds = normalizeColorIds(rawColorIds);
  if (colorIds == null) return null;
  const titleEn = body.titleEn != null ? String(body.titleEn) : null;
  const description =
    body.description != null ? String(body.description) : null;
  if (!isValidOptionalTitleEn(titleEn)) return null;
  if (!isValidOptionalDescription(description)) return null;
  return {
    titleAr,
    titleEn,
    description,
    imageUrl,
    category,
    isPublished: body.isPublished !== false,
    sizes,
    colorIds,
  };
}

export async function POST(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const ip = getClientIp(req);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const p = parseCreate(json);
  if (!p) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const colorIds = p.colorIds ?? [];
  try {
    const row = await prisma.collectionItem.create({
      data: {
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        isPublished: p.isPublished,
        sizes: p.sizes,
        colors:
          colorIds.length > 0
            ? { connect: colorIds.map((cid) => ({ id: cid })) }
            : undefined,
      },
      include: { colors: true },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "Product",
      entityId: row.id,
      metadata: { titleAr: p.titleAr },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الإنشاء" }, { status: 400 });
  }
}
