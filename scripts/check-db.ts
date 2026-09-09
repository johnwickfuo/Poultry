import "dotenv/config";

import { prisma } from "../src/server/database/prisma";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.info("MySQL connection successful.");
}

main()
  .catch(() => {
    console.error("MySQL connection failed. Check DATABASE_URL and server access.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
