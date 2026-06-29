import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DependencyCategory = "dependencies" | "devDependencies" | "optionalDependencies" | "peerDependencies";

export type DirectDependency = {
  name: string;
  requestedRange: string;
  requestedSpec: string;
  category: DependencyCategory;
  lockfileVersion?: string;
};

type PackageJson = {
  scripts?: Record<string, string>;
} & Partial<Record<DependencyCategory, Record<string, string>>>;

type PackageLockJson = {
  packages?: Record<string, { version?: string }>;
};

const dependencyCategories: DependencyCategory[] = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

export async function readPackageJson(cwd = process.cwd()): Promise<PackageJson> {
  const raw = await readFile(join(cwd, "package.json"), "utf8").catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`Unable to read package.json: ${message}`), { code: "PROJECT_PACKAGE_ERROR" });
  });

  return JSON.parse(raw) as PackageJson;
}

export async function readDirectDependencies(cwd = process.cwd(), options: { preferLockfile?: boolean } = {}): Promise<DirectDependency[]> {
  const packageJson = await readPackageJson(cwd);
  const lockVersions = options.preferLockfile ? await readLockfileVersions(cwd) : new Map<string, string>();
  const dependencies: DirectDependency[] = [];

  for (const category of dependencyCategories) {
    const entries = Object.entries(packageJson[category] ?? {});
    for (const [name, requestedRange] of entries) {
      const lockfileVersion = lockVersions.get(name);
      dependencies.push({
        name,
        requestedRange,
        requestedSpec: lockfileVersion ? `${name}@${lockfileVersion}` : `${name}@${requestedRange}`,
        category,
        lockfileVersion
      });
    }
  }

  return dependencies;
}

export async function readPackageScripts(cwd = process.cwd()): Promise<Record<string, string>> {
  const packageJson = await readPackageJson(cwd);
  return packageJson.scripts ?? {};
}

async function readLockfileVersions(cwd: string): Promise<Map<string, string>> {
  const raw = await readFile(join(cwd, "package-lock.json"), "utf8").catch(() => undefined);
  if (!raw) {
    return new Map();
  }

  const parsed = JSON.parse(raw) as PackageLockJson;
  const versions = new Map<string, string>();
  for (const [path, entry] of Object.entries(parsed.packages ?? {})) {
    if (!path.startsWith("node_modules/") || !entry.version) {
      continue;
    }

    const name = path.slice("node_modules/".length);
    if (!name.includes("node_modules/")) {
      versions.set(name, entry.version);
    }
  }

  return versions;
}
