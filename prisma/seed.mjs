import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** @type {Array<{ titleAr: string; titleEn: string | null; description: string | null; imageUrl: string; category: string }>} */
const seedItems = [
  {
    titleAr: "فستان أنيق",
    titleEn: "Elegant dress",
    description: "تفاصيل راقية وخامة ممتازة.",
    imageUrl: "/assets/p1.jpg",
    category: "dresses",
  },
  {
    titleAr: "عباية فخمة",
    titleEn: "Luxury abaya",
    description: "مناسبة للمناسبات والإطلالات اليومية.",
    imageUrl: "/assets/p2.jpg",
    category: "abayas",
  },
  {
    titleAr: "طقم كاجوال",
    titleEn: "Casual set",
    description: "ستايل مريح وعصري.",
    imageUrl: "/assets/p3.jpg",
    category: "casual",
  },
  {
    titleAr: "إكسسوارات",
    titleEn: "Accessories",
    description: "لمسة نهائية لإطلالة مثالية.",
    imageUrl: "/assets/p4.jpg",
    category: "accessories",
  },
];

async function main() {
  // AR: نفرّغ الجدول ثم نعيد البذور لضمان تطابق بيانات العرض مع المحتوى الحالي.
  // EN: Reset then seed so demo content matches the current marketing gallery.
  await prisma.collectionItem.deleteMany({});

  await prisma.collectionItem.createMany({
    data: seedItems.map((item) => ({
      ...item,
      isPublished: true,
    })),
  });
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
