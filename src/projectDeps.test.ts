import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readDirectDependencies, readPackageScripts } from "./projectDeps.js";

describe("project dependencies", () => {
  it("reads package.json direct dependencies", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-project-deps-"));
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({
        dependencies: { zod: "^4.0.0" },
        devDependencies: { vitest: "^1.0.0" }
      })
    );

    await expect(readDirectDependencies(cwd)).resolves.toEqual([
      {
        name: "zod",
        requestedRange: "^4.0.0",
        requestedSpec: "zod@^4.0.0",
        category: "dependencies"
      },
      {
        name: "vitest",
        requestedRange: "^1.0.0",
        requestedSpec: "vitest@^1.0.0",
        category: "devDependencies"
      }
    ]);
  });

  it("uses package-lock direct versions when requested", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-project-lock-"));
    await mkdir(join(cwd, "node_modules"), { recursive: true });
    await writeFile(join(cwd, "package.json"), JSON.stringify({ dependencies: { zod: "^4.0.0" } }));
    await writeFile(
      join(cwd, "package-lock.json"),
      JSON.stringify({
        packages: {
          "": {},
          "node_modules/zod": { version: "4.4.3" }
        }
      })
    );

    const dependencies = await readDirectDependencies(cwd, { preferLockfile: true });

    expect(dependencies[0]).toMatchObject({
      name: "zod",
      requestedSpec: "zod@4.4.3",
      lockfileVersion: "4.4.3"
    });
  });

  it("reads package scripts", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-scripts-"));
    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));

    await expect(readPackageScripts(cwd)).resolves.toEqual({ test: "vitest run" });
  });
});
