import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type CacheStatus = {
  path: string;
  exists: boolean;
  files: number;
  bytes: number;
};

export function getDefaultCachePath(): string {
  return join(homedir(), ".latch", "cache");
}

export async function getCacheStatus(cachePath = getDefaultCachePath()): Promise<CacheStatus> {
  const exists = await stat(cachePath)
    .then((value) => value.isDirectory())
    .catch(() => false);

  if (!exists) {
    return { path: cachePath, exists: false, files: 0, bytes: 0 };
  }

  const totals = await walkCache(cachePath);
  return { path: cachePath, exists: true, files: totals.files, bytes: totals.bytes };
}

export async function clearCache(cachePath = getDefaultCachePath()): Promise<CacheStatus> {
  await rm(cachePath, { recursive: true, force: true });
  await mkdir(cachePath, { recursive: true });
  return getCacheStatus(cachePath);
}

export function formatCacheStatus(status: CacheStatus): string {
  return [
    "Latch cache",
    `  Path: ${status.path}`,
    `  Exists: ${status.exists ? "yes" : "no"}`,
    `  Files: ${status.files}`,
    `  Size: ${formatBytes(status.bytes)}`
  ].join("\n");
}

async function walkCache(directory: string): Promise<{ files: number; bytes: number }> {
  const entries = await readdir(directory, { withFileTypes: true });
  let files = 0;
  let bytes = 0;

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = await walkCache(path);
      files += child.files;
      bytes += child.bytes;
    } else if (entry.isFile()) {
      const file = await stat(path);
      files += 1;
      bytes += file.size;
    }
  }

  return { files, bytes };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
