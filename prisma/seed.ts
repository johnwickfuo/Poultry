import "dotenv/config";

import { UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

import { prisma } from "../src/server/database/prisma";
import {
  serializeSetting,
  SETTING_SEED_VALUES,
  type SettingKey,
  type SettingValue,
} from "../src/server/settings/registry";
import { POULTRY_TAXONOMY } from "../src/server/categories/taxonomy";

const roleNames = ["admin", "seller", "mentor", "worker", "employer"] as const;

async function main() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.SUPER_ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !username || !password || password.length < 12) {
    throw new Error(
      "Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME and a SUPER_ADMIN_PASSWORD of at least 12 characters.",
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const roleName of roleNames) {
      await tx.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }

    for (const [key, value] of Object.entries(SETTING_SEED_VALUES) as Array<
      [SettingKey, SettingValue<SettingKey>]
    >) {
      const serialized = serializeSetting(key, value);
      await tx.setting.upsert({
        where: { key },
        update: {},
        create: { key, value: serialized },
      });
    }

    for (const [parentIndex, category] of POULTRY_TAXONOMY.entries()) {
      const parent = await tx.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          imagePath: category.imagePath,
          icon: category.icon,
          sortOrder: parentIndex,
        },
      });

      for (const [childIndex, subcategory] of category.children.entries()) {
        await tx.category.upsert({
          where: { slug: subcategory.slug },
          update: { parentId: parent.id },
          create: {
            ...subcategory,
            parentId: parent.id,
            sortOrder: childIndex,
          },
        });
      }
    }

    const adminRole = await tx.role.findUniqueOrThrow({
      where: { name: "admin" },
    });
    const passwordHash = await hash(password, 12);
    const user = await tx.user.upsert({
      where: { email },
      update: {
        username,
        passwordHash,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      create: {
        email,
        username,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await tx.profile.upsert({
      where: { userId: user.id },
      update: { displayName: name, fullName: name },
      create: { userId: user.id, displayName: name, fullName: name },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id },
    });
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  });
