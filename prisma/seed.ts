import "dotenv/config";

import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

import { prisma } from "../src/server/database/prisma";

async function main() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set SUPER_ADMIN_EMAIL and a SUPER_ADMIN_PASSWORD of at least 12 characters.",
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: UserRole.SUPER_ADMIN },
    create: { name, email, passwordHash, role: UserRole.SUPER_ADMIN },
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  });
