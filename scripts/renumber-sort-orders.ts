/**
 * One-off repair: renumber catalog rows that share the same sortOrder (e.g. many 0s).
 *
 * Usage:
 *   npx tsx scripts/renumber-sort-orders.ts           # dry-run (default)
 *   npx tsx scripts/renumber-sort-orders.ts --apply    # write changes
 */
import "dotenv/config";
import { prisma } from "../src/server/db/client";
import {
  buildRenumberPlan,
  countDuplicateSortOrders,
  type RenumberPlanRow,
} from "../src/lib/admin/renumber-sort-orders";
import {
  getProductCategories,
  saveProductCategories,
  type ProductCategoryRecord,
} from "../src/lib/categories/product-categories";

const apply = process.argv.includes("--apply");

async function applySortOrderPlan<T extends { id: string }>(
  plan: RenumberPlanRow<T>[],
  update: (id: string, sortOrder: number) => Promise<unknown>,
): Promise<void> {
  await Promise.all(plan.map((p) => update(p.item.id, p.to)));
}

function tieCreatedAtThenId(
  a: { createdAt?: Date | null; id: string },
  b: { createdAt?: Date | null; id: string },
): number {
  const ta = a.createdAt?.getTime() ?? 0;
  const tb = b.createdAt?.getTime() ?? 0;
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

function logSection(title: string) {
  console.log(`\n── ${title} ──`);
}

function printPlan(
  label: string,
  rows: { id: string; label: string; from: number; to: number }[],
) {
  if (rows.length === 0) {
    console.log(`${label}: لا تغييرات مطلوبة.`);
    return;
  }
  console.log(`${label}: ${rows.length} سجل/سجلات`);
  for (const r of rows.slice(0, 20)) {
    console.log(`  · ${r.label} (${r.id}): ${r.from} → ${r.to}`);
  }
  if (rows.length > 20) {
    console.log(`  … و${rows.length - 20} أخرى`);
  }
}

async function renumberColors() {
  const colors = await prisma.color.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  const dupesBefore = countDuplicateSortOrders(colors);
  const plan = buildRenumberPlan(colors, (a, b) => a.id.localeCompare(b.id));
  printPlan(
    "الألوان",
    plan.map((p) => ({
      id: p.item.id,
      label: p.item.label,
      from: p.from,
      to: p.to,
    })),
  );
  if (dupesBefore > 0) {
    console.log(`  (تكرارات sortOrder قبل الإصلاح: ${dupesBefore})`);
  }
  if (apply && plan.length > 0) {
    await applySortOrderPlan(plan, (id, sortOrder) =>
      prisma.color.update({ where: { id }, data: { sortOrder } }),
    );
  }
  return plan.length;
}

async function renumberBrands() {
  const rows = await prisma.brandDesigner.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
  });
  const dupesBefore = countDuplicateSortOrders(rows);
  const plan = buildRenumberPlan(rows, tieCreatedAtThenId);
  printPlan(
    "الماركات / المصممون",
    plan.map((p) => ({
      id: p.item.id,
      label: p.item.nameAr,
      from: p.from,
      to: p.to,
    })),
  );
  if (dupesBefore > 0) {
    console.log(`  (تكرارات sortOrder قبل الإصلاح: ${dupesBefore})`);
  }
  if (apply && plan.length > 0) {
    await applySortOrderPlan(plan, (id, sortOrder) =>
      prisma.brandDesigner.update({ where: { id }, data: { sortOrder } }),
    );
  }
  return plan.length;
}

async function renumberTestimonials() {
  const rows = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { customerName: "asc" }],
  });
  const dupesBefore = countDuplicateSortOrders(rows);
  const plan = buildRenumberPlan(rows, tieCreatedAtThenId);
  printPlan(
    "آراء العملاء",
    plan.map((p) => ({
      id: p.item.id,
      label: p.item.customerName,
      from: p.from,
      to: p.to,
    })),
  );
  if (dupesBefore > 0) {
    console.log(`  (تكرارات sortOrder قبل الإصلاح: ${dupesBefore})`);
  }
  if (apply && plan.length > 0) {
    await applySortOrderPlan(plan, (id, sortOrder) =>
      prisma.testimonial.update({ where: { id }, data: { sortOrder } }),
    );
  }
  return plan.length;
}

async function renumberSizes() {
  const rows = await prisma.sizeOption.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });
  const byType = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byType.get(row.type) ?? [];
    list.push(row);
    byType.set(row.type, list);
  }

  let total = 0;
  for (const [type, group] of byType) {
    const dupesBefore = countDuplicateSortOrders(group);
    const plan = buildRenumberPlan(group, tieCreatedAtThenId);
    printPlan(
      `المقاسات (${type})`,
      plan.map((p) => ({
        id: p.item.id,
        label: p.item.label,
        from: p.from,
        to: p.to,
      })),
    );
    if (dupesBefore > 0) {
      console.log(`  (تكرارات sortOrder قبل الإصلاح: ${dupesBefore})`);
    }
    if (apply && plan.length > 0) {
      await applySortOrderPlan(plan, (id, sortOrder) =>
        prisma.sizeOption.update({ where: { id }, data: { sortOrder } }),
      );
    }
    total += plan.length;
  }
  return total;
}

async function renumberCategories() {
  const all = await getProductCategories(true);
  const dupesBefore = countDuplicateSortOrders(all);
  const plan = buildRenumberPlan(all, (a, b) => a.slug.localeCompare(b.slug));
  printPlan(
    "أقسام المنتجات",
    plan.map((p) => ({
      id: p.item.id,
      label: `${p.item.nameAr} (${p.item.slug})`,
      from: p.from,
      to: p.to,
    })),
  );
  if (dupesBefore > 0) {
    console.log(`  (تكرارات sortOrder قبل الإصلاح: ${dupesBefore})`);
  }
  if (apply && plan.length > 0) {
    const next: ProductCategoryRecord[] = all.map((c) => {
      const hit = plan.find((p) => p.item.id === c.id);
      return hit ? { ...c, sortOrder: hit.to } : c;
    });
    await saveProductCategories(next);
  }
  return plan.length;
}

async function main() {
  console.log(
    apply
      ? "تطبيق إعادة الترقيم على قاعدة البيانات…"
      : "وضع تجريبي (dry-run) — لا يُحفظ شيء. أضف --apply للتطبيق.",
  );

  logSection("فحص وإصلاح");
  const counts = {
    colors: await renumberColors(),
    brands: await renumberBrands(),
    testimonials: await renumberTestimonials(),
    sizes: await renumberSizes(),
    categories: await renumberCategories(),
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\nالمجموع: ${total} تحديث/تحديثات مقترحة.`);
  if (!apply && total > 0) {
    console.log("\nللتطبيق الفعلي:");
    console.log("  npx tsx scripts/renumber-sort-orders.ts --apply");
    console.log("  أو: npm run renumber:sort-orders -- --apply");
  } else if (apply && total > 0) {
    console.log("\nتم الحفظ بنجاح.");
  }
}

main()
  .catch((e) => {
    console.error("فشل:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
