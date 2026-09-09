import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

function storageRoot() {
  return path.resolve(
    /* turbopackIgnore: true */
    process.env.STORAGE_ROOT?.trim() ||
      path.join(process.cwd(), "storage", "uploads"),
  );
}

function safeStoragePath(key: string) {
  const parts = key.split("/");
  if (
    !parts.length ||
    parts.some((part) => !part || !/^[a-zA-Z0-9._-]+$/.test(part))
  ) {
    throw new Error("Invalid storage key.");
  }

  const root = storageRoot();
  const target = path.resolve(root, ...parts);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage key.");
  return target;
}

export const localStorage = {
  async put(key: string, contents: Uint8Array) {
    const target = safeStoragePath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, { flag: "wx" });
    return `/media/${key}`;
  },

  async delete(publicPath: string) {
    if (!publicPath.startsWith("/media/")) return;
    const target = safeStoragePath(publicPath.slice("/media/".length));
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  },

  async read(parts: string[]) {
    return readFile(safeStoragePath(parts.join("/")));
  },
};
