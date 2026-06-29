import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveScript } from "./scriptRunner.js";

describe("script runner", () => {
  it("resolves package scripts and passes args after --", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-run-"));
    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "node test.js" } }));

    await expect(resolveScript("test", ["--watch"], cwd)).resolves.toEqual({
      name: "test",
      command: "node test.js",
      npmCommand: {
        command: "npm",
        args: ["run", "test", "--", "--watch"]
      }
    });
  });

  it("throws a clear error for a missing script", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-run-missing-"));
    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "node test.js" } }));

    await expect(resolveScript("build", [], cwd)).rejects.toMatchObject({
      code: "SCRIPT_NOT_FOUND",
      message: "Script not found in package.json: build"
    });
  });
});
