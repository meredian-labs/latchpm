import { readFile } from "node:fs/promises";
import { join } from "node:path";
const dependencyCategories = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
export async function readPackageJson(cwd = process.cwd()) {
    const raw = await readFile(join(cwd, "package.json"), "utf8").catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        throw Object.assign(new Error(`Unable to read package.json: ${message}`), { code: "PROJECT_PACKAGE_ERROR" });
    });
    return JSON.parse(raw);
}
export async function readDirectDependencies(cwd = process.cwd(), options = {}) {
    const packageJson = await readPackageJson(cwd);
    const lockVersions = options.preferLockfile ? await readLockfileVersions(cwd) : new Map();
    const dependencies = [];
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
export async function readPackageScripts(cwd = process.cwd()) {
    const packageJson = await readPackageJson(cwd);
    return packageJson.scripts ?? {};
}
async function readLockfileVersions(cwd) {
    const raw = await readFile(join(cwd, "package-lock.json"), "utf8").catch(() => undefined);
    if (!raw) {
        return new Map();
    }
    const parsed = JSON.parse(raw);
    const versions = new Map();
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
//# sourceMappingURL=projectDeps.js.map