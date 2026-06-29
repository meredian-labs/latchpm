import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clearCache, formatCacheStatus, getCacheStatus } from "./cacheCommands.js";

describe("cache commands", () => {
  it("reports cache status and path", async () => {
    const cachePath = await mkdtemp(join(tmpdir(), "latchpm-cache-test-"));
    await writeFile(join(cachePath, "report.json"), "{}");

    const status = await getCacheStatus(cachePath);

    expect(status.path).toBe(cachePath);
    expect(status.exists).toBe(true);
    expect(status.files).toBe(1);
    expect(formatCacheStatus(status)).toContain("Latch cache");
  });

  it("clears cache contents and recreates the directory", async () => {
    const cachePath = await mkdtemp(join(tmpdir(), "latchpm-cache-clear-"));
    await writeFile(join(cachePath, "report.json"), "{}");

    const status = await clearCache(cachePath);

    expect(status.exists).toBe(true);
    expect(status.files).toBe(0);
  });
});
