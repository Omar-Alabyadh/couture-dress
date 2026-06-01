import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
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
  legacySizesFromNormalizedVariants,
  normalizeColorIds,
  normalizeProductImagesForSave,
  normalizeProductSizes,
  normalizeProductVariantsInput,
  parseCurrency,
  parseOptionalPrice,
  type NormalizedProductVariantInput,
} from "@/lib/validation/product-input";
import {
  serializeProductForAdmin,
  type ProductWithColorsImagesVariants,
} from "@/lib/serializers/product-admin";
import { variantColorIdsExistOnDb } from "@/lib/products/validate-variant-colors";
import { resolveBrandDesignerLinkForProduct } from "@/lib/products/resolve-brand-designer-id";
import { getAllowedCategorySlugs } from "@/lib/categories/product-categories";

function defaultVariantsFromSizesStrings(
  sizes: string[],
): NormalizedProductVariantInput[] | null {
  const norm = normalizeProductSizes(sizes);
  if (norm == null) return null;
  return norm.map((size, i) => ({
    size,
    colorId: null,
    colorLabel: null,
    quantity: 1,
    isAvailable: true,
    allowSpecialOrder: false,
    sortOrder: i,
  }));
}

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const rows = await listCollectionForAdmin();
    const data = rows.map((row) =>
      serializeProductForAdmin(row as ProductWithColorsImagesVariants),
    );
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
  price?: string | null;
  currency: string;
  images?: unknown;
  variants?: unknown;
  brandDesignerId?: string | null;
};

function parseCreate(
  body: unknown,
  allowedCategories: Set<string>,
): CreateBody | null {
  if (!isRecord(body)) return null;
  const titleAr = String(body.titleAr ?? "").trim();
  const category = String(body.category ?? "").trim();
  if (!isValidTitleAr(titleAr)) return null;
  if (!allowedCategories.has(category)) return null;

  const hasImagesArray =
    Array.isArray(body.images) && body.images.length > 0;
  const imageUrlRaw = String(body.imageUrl ?? "").trim();
  let resolvedImageUrl = imageUrlRaw;
  if (!resolvedImageUrl && hasImagesArray) {
    const first = (body.images as unknown[])[0];
    if (first && typeof first === "object") {
      resolvedImageUrl = String(
        (first as Record<string, unknown>).url ?? "",
      ).trim();
    }
  }
  if (!isSafeProductImageUrl(resolvedImageUrl)) return null;

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

  const priceParsed = parseOptionalPrice(body.price);
  if (priceParsed === "invalid") return null;
  const currency = parseCurrency(body.currency, "LYD");

  let brandDesignerId: string | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(body, "brandDesignerId")) {
    if (body.brandDesignerId === null || body.brandDesignerId === "") {
      brandDesignerId = null;
    } else {
      brandDesignerId = String(body.brandDesignerId).trim() || null;
    }
  }

  return {
    titleAr,
    titleEn,
    description,
    imageUrl: resolvedImageUrl,
    category,
    isPublished: body.isPublished !== false,
    sizes,
    colorIds,
    price: priceParsed,
    currency,
    images: body.images,
    variants: body.variants,
    brandDesignerId,
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
  const allowedCategories = await getAllowedCategorySlugs();
  const p = parseCreate(json, allowedCategories);
  if (!p) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const altBase = p.titleEn?.trim() ? p.titleEn : p.titleAr;
  const imgNorm = normalizeProductImagesForSave(
    p.images,
    p.imageUrl,
    altBase,
  );
  if (!imgNorm.ok) {
    return NextResponse.json({ error: "صور غير صالحة" }, { status: 400 });
  }
  const primaryUrl =
    imgNorm.rows.find((x) => x.isPrimary)?.url ?? imgNorm.rows[0]!.url;

  let variantRows: NormalizedProductVariantInput[];
  if (Array.isArray(p.variants)) {
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
    variantRows = nv.rows;
  } else {
    const fb = defaultVariantsFromSizesStrings(p.sizes ?? []);
    if (!fb || fb.length === 0) {
      return NextResponse.json(
        { error: "أضيفي مقاسًا واحدًا على الأقل." },
        { status: 400 },
      );
    }
    variantRows = fb;
  }

  const okColors = await variantColorIdsExistOnDb(
    variantRows.map((v) => v.colorId),
  );
  if (!okColors) {
    return NextResponse.json({ error: "لون غير صالح في أحد الصفوف." }, { status: 400 });
  }

  // Single source of truth: store-filter colors are derived from the colors
  // chosen on the variant rows ("المقاسات والتوفر") — admin never picks twice.
  const derivedColorIds = Array.from(
    new Set(
      variantRows
        .map((v) => v.colorId)
        .filter((c): c is string => Boolean(c)),
    ),
  );

  let resolvedBrandId: string | undefined;
  if (p.brandDesignerId !== undefined && p.brandDesignerId !== null) {
    const link = await resolveBrandDesignerLinkForProduct(p.brandDesignerId);
    if (link.kind === "invalid") {
      return NextResponse.json(
        { error: "ماركة أو مصمم غير صالح أو مؤرشف." },
        { status: 400 },
      );
    }
    if (link.kind === "connect") resolvedBrandId = link.id;
  }

  const syncedSizes = legacySizesFromNormalizedVariants(variantRows);

  try {
    const row = await prisma.collectionItem.create({
      data: {
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        description: p.description,
        imageUrl: primaryUrl,
        price:
          p.price != null ? new Prisma.Decimal(p.price) : null,
        currency: p.currency,
        category: p.category,
        isPublished: p.isPublished,
        brandDesignerId: resolvedBrandId,
        sizes: syncedSizes,
        colors:
          derivedColorIds.length > 0
            ? { connect: derivedColorIds.map((cid) => ({ id: cid })) }
            : undefined,
        images: {
          create: imgNorm.rows.map((im) => ({
            url: im.url,
            alt: im.alt,
            isPrimary: im.isPrimary,
            sortOrder: im.sortOrder,
          })),
        },
        variants: {
          create: variantRows.map((v, i) => ({
            size: v.size,
            colorId: v.colorId,
            colorLabel: v.colorLabel,
            quantity: v.quantity,
            isAvailable: v.isAvailable,
            allowSpecialOrder: v.allowSpecialOrder,
            sortOrder: i,
          })),
        },
      },
      include: { colors: true, images: true, variants: true, brandDesigner: true },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "Product",
      entityId: row.id,
      metadata: { titleAr: p.titleAr },
      ip,
    });
    return NextResponse.json({
      data: serializeProductForAdmin(row as ProductWithColorsImagesVariants),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الإنشاء" }, { status: 400 });
  }
}
