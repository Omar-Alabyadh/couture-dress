import "dotenv/config";
import { prisma } from "../src/server/db/client";

async function main() {
  const user = await prisma.user.findFirst();
  const colors = await prisma.color.count();
  console.log("OK user:", user?.email, user?.role, "colors:", colors);
}

main()
  .catch((e) => {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
