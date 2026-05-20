import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { listTestimonialsForAdmin } from "@/server/repositories/cmsRepository";
import { isRecord } from "@/lib/validation/record";
import {
  clampRating,
  normalizeOptionalTestimonialImageUrl,
  normalizeTestimonialCustomerName,
  normalizeTestimonialText,
  parseTestimonialSortOrder,
} from "@/lib/validation/testimonial-input";
import { prepareTestimonialSortOrderInsert } from "@/server/services/sortOrderShiftService";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listTestimonialsForAdmin();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
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
  if (!isRecord(json)) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const customerName = normalizeTestimonialCustomerName(
    String(json.customerName ?? ""),
  );
  const text = normalizeTestimonialText(String(json.text ?? ""));
  if (!customerName || !text) {
    return NextResponse.json(
      { error: "اسم العميلة والنص مطلوبان." },
      { status: 400 },
    );
  }
  const rating = clampRating(Number(json.rating));
  const img = normalizeOptionalTestimonialImageUrl(json.imageUrl);
  if (!img.ok) {
    return NextResponse.json({ error: "رابط صورة غير صالح" }, { status: 400 });
  }
  const sortOrder = parseTestimonialSortOrder(json.sortOrder);
  const isPublished = json.isPublished !== false;
  try {
    const row = await prisma.$transaction(async (tx) => {
      await prepareTestimonialSortOrderInsert(sortOrder, tx);
      return tx.testimonial.create({
        data: {
          customerName,
          text,
          rating,
          imageUrl: img.value,
          isPublished,
          sortOrder,
          deletedAt: null,
        },
      });
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "Testimonial",
      entityId: row.id,
      metadata: { customerName },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الإنشاء" }, { status: 500 });
  }
}
