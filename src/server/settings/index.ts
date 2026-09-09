import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/server/database/prisma";
import {
  serializeSetting,
  SETTING_DEFINITIONS,
  type SettingKey,
  type SettingValue,
} from "./registry";

export const SETTINGS_CACHE_TAG = "platform-settings";

const readSettings = unstable_cache(
  async () => prisma.setting.findMany({ select: { key: true, value: true } }),
  ["platform-settings-v1"],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 3600 },
);

function parseSetting<K extends SettingKey>(key: K, raw?: string): SettingValue<K> {
  const definition = SETTING_DEFINITIONS[key];
  if (raw === undefined) return definition.defaultValue as SettingValue<K>;

  try {
    return definition.parse(raw) as SettingValue<K>;
  } catch {
    return definition.defaultValue as SettingValue<K>;
  }
}

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<SettingValue<K>> {
  const rows = await readSettings();
  const row = rows.find((setting) => setting.key === key);
  return parseSetting(key, row?.value);
}

export async function getSettings<const K extends readonly SettingKey[]>(
  keys: K,
): Promise<{ [P in K[number]]: SettingValue<P> }> {
  const rows = await readSettings();
  const values = new Map(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    keys.map((key) => [key, parseSetting(key, values.get(key))]),
  ) as { [P in K[number]]: SettingValue<P> };
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
) {
  const serialized = serializeSetting(key, value);

  await prisma.setting.upsert({
    where: { key },
    update: { value: serialized },
    create: { key, value: serialized },
  });
  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });
}

export async function setSettings(
  values: Partial<{ [K in SettingKey]: SettingValue<K> }>,
) {
  const entries = Object.entries(values) as Array<
    [SettingKey, SettingValue<SettingKey>]
  >;

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const serialized = serializeSetting(key, value);
      return prisma.setting.upsert({
        where: { key },
        update: { value: serialized },
        create: { key, value: serialized },
      });
    }),
  );
  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });
}
