import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  isSafeProductImageUrl,
  isValidOptionalDescription,
  isValidOptionalTitleEn,
  isValidTitleAr,
  normalizeColorIds,
  normalizeProductSizes,
} from "@/lib/validation/product-input";
import type { Prisma } from "@/generated/prisma/client";

const CATEGORIES = new Set(["dresses", "abayas", "casual", "accessories"]);

type Ctx = { params: Promise<{ id: string }> };

type PatchBody = {
  titleAr?: string;
  titleEn?: string | null;
  description?: string | null;
  imageUrl?: string;
  category?: string;
  isPublished?: boolean;
  sizes?: string[];
  colorIds?: string[];
};

function parsePatch(body: unknown): PatchBody | null {
  if (!isRecord(body)) return null;
  const out: PatchBody = {};
  if (body.titleAr !== undefined) out.titleAr = String(body.titleAr);
  if (body.titleEn !== undefined) {
    out.titleEn = body.titleEn === null ? null : String(body.titleEn);
  }
  if (body.description !== undefined) {
    out.description = body.description === null ? null : String(body.description);
  }
  if (body.imageUrl !== undefined) out.imageUrl = String(body.imageUrl);
  if (body.category !== undefined) out.category = String(body.category);
  if (body.isPublished !== undefined) {
    out.isPublished = Boolean(body.isPublished);
  }
  if (Array.isArray(body.sizes)) {
    out.sizes = (body.sizes as unknown[])
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (Array.isArray(body.colorIds)) {
    out.colorIds = (body.colorIds as unknown[])
      .map((c) => String(c).trim())
      .filter(Boolean);
  }
  return out;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
  const ip = getClientIp(req);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const p = parsePatch(json);
  if (!p) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  if (p.category && !CATEGORIES.has(p.category)) {
    return NextResponse.json({ error: "تصنيف غير صالح" }, { status: 400 });
  }
  if (p.titleAr !== undefined && !isValidTitleAr(p.titleAr)) {
    return NextResponse.json({ error: "عنوان غير صالح" }, { status: 400 });
  }
  if (p.titleEn !== undefined && !isValidOptionalTitleEn(p.titleEn)) {
    return NextResponse.json({ error: "عنوان EN غير صالح" }, { status: 400 });
  }
  if (p.description !== undefined && !isValidOptionalDescription(p.description)) {
    return NextResponse.json({ error: "وصف طويل جدًا" }, { status: 400 });
  }
  if (p.imageUrl !== undefined && !isSafeProductImageUrl(p.imageUrl)) {
    return NextResponse.json({ error: "رابط صورة غير صالح" }, { status: 400 });
  }
  if (p.sizes !== undefined) {
    const normalized = normalizeProductSizes(p.sizes);
    if (normalized == null) {
      return NextResponse.json({ error: "مقاسات غير صالحة" }, { status: 400 });
    }
    p.sizes = normalized;
  }
  if (p.colorIds !== undefined) {
    const normalized = normalizeColorIds(p.colorIds);
    if (normalized == null) {
      return NextResponse.json({ error: "ألوان كثيرة جدًا" }, { status: 400 });
    }
    p.colorIds = normalized;
  }
  try {
    const data: Prisma.CollectionItemUpdateInput = {};
    if (p.titleAr !== undefined) data.titleAr = p.titleAr.trim();
    if (p.titleEn !== undefined) data.titleEn = p.titleEn;
    if (p.description !== undefined) data.description = p.description;
    if (p.imageUrl !== undefined) data.imageUrl = p.imageUrl.trim();
    if (p.category !== undefined) data.category = p.category;
    if (p.isPublished !== undefined) data.isPublished = p.isPublished;
    if (p.sizes !== undefined) data.sizes = p.sizes;
    if (p.colorIds !== undefined) {
      data.colors = { set: p.colorIds.map((i) => ({ id: i })) };
    }
    const row = await prisma.collectionItem.update({
      where: { id, deletedAt: null },
      data,
      include: { colors: true },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
  const ip = getClientIp(_req);
  try {
    const row = await prisma.collectionItem.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "SOFT_DELETE",
      entityType: "Product",
      entityId: id,
      metadata: { titleAr: row.titleAr },
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 400 });
  }
}
