import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import {
  serializeProductForAdmin,
  type ProductWithColorsImagesVariants,
} from "@/lib/serializers/product-admin";
import { isRecord } from "@/lib/validation/record";
import {
  isSafeProductImageUrl,
  isValidOptionalDescription,
  isValidOptionalTitleEn,
  isValidTitleAr,
  legacySizesFromNormalizedVariants,
  normalizeColorIds,
  normalizeProductImagesForSave,
  normalizeProductSizes,
  normalizeProductVariantsInput,
  parseCurrency,
  parseOptionalPrice,
  type NormalizedProductVariantInput,
} from "@/lib/validation/product-input";
import { variantColorIdsExistOnDb } from "@/lib/products/validate-variant-colors";
import { resolveBrandDesignerLinkForProduct } from "@/lib/products/resolve-brand-designer-id";
import { getAllowedCategorySlugs } from "@/lib/categories/product-categories";

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
  price?: string | null;
  currency?: string;
  images?: unknown;
  variants?: unknown;
  brandDesignerId?: unknown;
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
  if (body.price !== undefined) {
    out.price =
      body.price === null || body.price === ""
        ? null
        : String(body.price);
  }
  if (body.currency !== undefined) out.currency = String(body.currency);
  if (body.images !== undefined) out.images = body.images;
  if (body.variants !== undefined) out.variants = body.variants;
  if (Object.prototype.hasOwnProperty.call(body, "brandDesignerId")) {
    out.brandDesignerId = body.brandDesignerId;
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
  if (p.category) {
    const allowed = await getAllowedCategorySlugs();
    if (!allowed.has(p.category)) {
      return NextResponse.json({ error: "تصنيف غير صالح" }, { status: 400 });
    }
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
  if (p.imageUrl !== undefined && !isSafeProductImageUrl(p.imageUrl.trim())) {
    return NextResponse.json({ error: "رابط صورة غير صالح" }, { status: 400 });
  }
  if (p.price !== undefined && p.price !== null && p.price !== "") {
    const pr = parseOptionalPrice(p.price);
    if (pr === "invalid") {
      return NextResponse.json({ error: "سعر غير صالح" }, { status: 400 });
    }
    p.price = pr;
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

  let variantReplace: NormalizedProductVariantInput[] | null = null;
  if (p.variants !== undefined) {
    if (!Array.isArray(p.variants)) {
      return NextResponse.json({ error: "variants يجب أن تكون مصفوفة" }, { status: 400 });
    }
    const nv = normalizeProductVariantsInput(p.variants);
    if (!nv.ok) {
      return NextResponse.json({ error: "مقاسات/variants غير صالحة" }, { status: 400 });
    }
    if (nv.rows.length === 0) {
      return NextResponse.json(
        { error: "أضيفي صف مقاس واحد على الأقل في «المقاسات والتوفر»." },
        { status: 400 },
      );
    }
    const okColors = await variantColorIdsExistOnDb(
      nv.rows.map((v) => v.colorId),
    );
    if (!okColors) {
      return NextResponse.json({ error: "لون غير صالح في أحد الصفوف." }, { status: 400 });
    }
    variantReplace = nv.rows;
  }

  try {
    const existing = await prisma.collectionItem.findFirst({
      where: { id, deletedAt: null },
      include: { images: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    const data: Prisma.CollectionItemUpdateInput = {};
    if (p.titleAr !== undefined) data.titleAr = p.titleAr.trim();
    if (p.titleEn !== undefined) data.titleEn = p.titleEn;
    if (p.description !== undefined) data.description = p.description;
    if (p.category !== undefined) data.category = p.category;
    if (p.isPublished !== undefined) data.isPublished = p.isPublished;
    if (p.sizes !== undefined && variantReplace == null) {
      data.sizes = p.sizes;
    }
    if (p.colorIds !== undefined) {
      data.colors = { set: p.colorIds.map((i) => ({ id: i })) };
    }
    if (p.currency !== undefined) {
      data.currency = parseCurrency(p.currency, existing.currency || "LYD");
    }
    if (p.price !== undefined) {
      data.price =
        p.price === null || p.price === ""
          ? null
          : new Prisma.Decimal(p.price);
    }

    if (variantReplace != null) {
      data.sizes = legacySizesFromNormalizedVariants(variantReplace);
      data.variants = {
        deleteMany: {},
        create: variantReplace.map((v, i) => ({
          size: v.size,
          colorId: v.colorId,
          colorLabel: v.colorLabel,
          quantity: v.quantity,
          isAvailable: v.isAvailable,
          allowSpecialOrder: v.allowSpecialOrder,
          sortOrder: i,
        })),
      };
    }

    const nextTitleAr =
      p.titleAr !== undefined ? p.titleAr.trim() : existing.titleAr;
    const nextTitleEn =
      p.titleEn !== undefined ? p.titleEn : existing.titleEn;
    const altBase =
      nextTitleEn?.trim() ? nextTitleEn.trim() : nextTitleAr;

    if (p.images !== undefined) {
      const legacyUrl = (p.imageUrl ?? existing.imageUrl).trim();
      const imgNorm = normalizeProductImagesForSave(
        p.images,
        legacyUrl,
        altBase,
      );
      if (!imgNorm.ok) {
        return NextResponse.json({ error: "صور غير صالحة" }, { status: 400 });
      }
      const primaryUrl =
        imgNorm.rows.find((x) => x.isPrimary)?.url ?? imgNorm.rows[0]!.url;
      data.imageUrl = primaryUrl;
      data.images = {
        deleteMany: {},
        create: imgNorm.rows.map((im) => ({
          url: im.url,
          alt: im.alt,
          isPrimary: im.isPrimary,
          sortOrder: im.sortOrder,
        })),
      };
    } else if (p.imageUrl !== undefined) {
      const nu = p.imageUrl.trim();
      data.imageUrl = nu;
      const primaryRow =
        existing.images.find((i) => i.isPrimary) ?? existing.images[0];
      if (primaryRow) {
        data.images = {
          update: {
            where: { id: primaryRow.id },
            data: { url: nu, alt: altBase },
          },
        };
      } else {
        data.images = {
          create: [
            {
              url: nu,
              alt: altBase,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        };
      }
    }

    if (p.brandDesignerId !== undefined) {
      const link = await resolveBrandDesignerLinkForProduct(p.brandDesignerId);
      if (link.kind === "invalid") {
        return NextResponse.json(
          { error: "ماركة أو مصمم غير صالح أو مؤرشف." },
          { status: 400 },
        );
      }
      if (link.kind === "clear") {
        data.brandDesigner = { disconnect: true };
      } else {
        data.brandDesigner = { connect: { id: link.id } };
      }
    }

    const row = await prisma.collectionItem.update({
      where: { id, deletedAt: null },
      data,
      include: { colors: true, images: true, variants: true, brandDesigner: true },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      ip,
    });
    return NextResponse.json({
      data: serializeProductForAdmin(row as ProductWithColorsImagesVariants),
    });
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
