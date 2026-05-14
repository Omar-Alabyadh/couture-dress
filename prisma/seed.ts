import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Color, Prisma } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const seedItems = [
  {
    titleAr: "فستان أنيق",
    titleEn: "Elegant dress",
    description: "تفاصيل راقية وخامة ممتازة.",
    imageUrl: "/assets/p1.jpg",
    category: "dresses",
    sizes: ["M", "L"],
    colorLabels: ["أسود", "بيج"],
    price: "450",
  },
  {
    titleAr: "عباية فخمة",
    titleEn: "Luxury abaya",
    description: "مناسبة للمناسبات والإطلالات اليومية.",
    imageUrl: "/assets/p2.jpg",
    category: "abayas",
    sizes: ["L", "XL"],
    colorLabels: ["كحلي", "أسود"],
    price: "520",
  },
  {
    titleAr: "طقم كاجوال",
    titleEn: "Casual set",
    description: "ستايل مريح وعصري.",
    imageUrl: "/assets/p3.jpg",
    category: "casual",
    sizes: ["S", "M", "L"],
    colorLabels: ["بيج", "كحلي"],
    price: "280",
  },
  {
    titleAr: "إكسسوارات",
    titleEn: "Accessories",
    description: "لمسة نهائية لإطلالة مثالية.",
    imageUrl: "/assets/p4.jpg",
    category: "accessories",
    sizes: ["—"],
    colorLabels: ["أحمر", "أسود"],
    price: "120",
  },
];

const seedColors = [
  { label: "أسود", hex: "111111", sortOrder: 0 },
  { label: "كحلي", hex: "1a1f3a", sortOrder: 1 },
  { label: "بيج", hex: "c4a78c", sortOrder: 2 },
  { label: "أحمر", hex: "7a1c2a", sortOrder: 3 },
];

async function main() {
  await prisma.collectionItem.deleteMany({});
  await prisma.color.deleteMany({});

  const colors: Color[] = [];
  for (const c of seedColors) {
    const row = await prisma.color.create({
      data: { ...c, deletedAt: null },
    });
    colors.push(row);
  }
  const byLabel = (name: string) => colors.find((x) => x.label === name);
  for (const item of seedItems) {
    const connect = (item.colorLabels || [])
      .map((l) => byLabel(l))
      .filter(Boolean)
      .map((c) => ({ id: c!.id }));
    await prisma.collectionItem.create({
      data: {
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        description: item.description,
        imageUrl: item.imageUrl,
        price: new Prisma.Decimal(item.price),
        currency: "LYD",
        category: item.category,
        isPublished: true,
        sizes: item.sizes,
        colors: connect.length ? { connect } : undefined,
        images: {
          create: [
            {
              url: item.imageUrl,
              alt: item.titleEn ?? item.titleAr,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
        variants: {
          create: item.sizes.map((size, i) => ({
            size,
            colorId: null,
            quantity: 1,
            isAvailable: true,
            allowSpecialOrder: false,
            sortOrder: i,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
