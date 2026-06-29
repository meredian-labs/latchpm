import { execFile } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { getDefaultCachePath } from "./cacheCommands.js";

const execFileAsync = promisify(execFile);
const DEFAULT_POLICY_FILE = "latch.policy.json";
const DEFAULT_REGISTRY_URL = "https://registry.npmjs.org";

export type DoctorCheck = {
  name: string;
  ok: boolean;
  message: string;
};

export type DoctorReport = {
  ready: boolean;
  checks: DoctorCheck[];
};

export type DoctorOptions = {
  cachePath?: string;
  registryUrl?: string;
  cwd?: string;
  fetchImpl?: typeof fetch;
};

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const cachePath = options.cachePath ?? getDefaultCachePath();
  const registryUrl = options.registryUrl ?? DEFAULT_REGISTRY_URL;
  const cwd = options.cwd ?? process.cwd();
  const fetchImpl = options.fetchImpl ?? fetch;
  const checks: DoctorCheck[] = [];

  checks.push(checkNodeVersion(process.versions.node));
  checks.push(await checkNpmVersion());
  checks.push(await checkCacheWritable(cachePath));
  checks.push(await checkRegistry(registryUrl, fetchImpl));
  checks.push(await checkPolicyFile(cwd));

  return {
    ready: checks.every((check) => check.ok || check.name === "policy"),
    checks
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  return [
    "LatchPM Doctor",
    ...report.checks.map((check) => `  ${check.ok ? "ok" : "!!"} ${check.name}: ${check.message}`),
    `Status: ${report.ready ? "ready" : "not ready"}`
  ].join("\n");
}

export function checkNodeVersion(version: string): DoctorCheck {
  const major = Number(version.split(".")[0]);
  return {
    name: "node",
    ok: major >= 18,
    message: major >= 18 ? `Node ${version}` : `Node ${version}; Node 18 or newer is required`
  };
}

async function checkNpmVersion(): Promise<DoctorCheck> {
  try {
    const { stdout } = await execFileAsync("npm", ["--version"]);
    return { name: "npm", ok: true, message: `npm ${stdout.trim()}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: "npm", ok: false, message: `npm unavailable: ${message}` };
  }
}

async function checkCacheWritable(cachePath: string): Promise<DoctorCheck> {
  const probe = join(cachePath, ".doctor-write-test");
  try {
    await mkdir(cachePath, { recursive: true });
    await writeFile(probe, "ok");
    await rm(probe, { force: true });
    return { name: "cache", ok: true, message: `${cachePath} is writable` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: "cache", ok: false, message: `${cachePath} is not writable: ${message}` };
  }
}

async function checkRegistry(registryUrl: string, fetchImpl: typeof fetch): Promise<DoctorCheck> {
  try {
    const response = await fetchImpl(registryUrl, { method: "GET" });
    return {
      name: "registry",
      ok: response.ok,
      message: response.ok ? `${registryUrl} reachable` : `${registryUrl} returned ${response.status}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: "registry", ok: false, message: `${registryUrl} unreachable: ${message}` };
  }
}

async function checkPolicyFile(cwd: string): Promise<DoctorCheck> {
  const policyPath = join(cwd, DEFAULT_POLICY_FILE);
  const exists = await access(policyPath)
    .then(() => true)
    .catch(() => false);
  return {
    name: "policy",
    ok: true,
    message: exists ? `found ${policyPath}` : `no ${DEFAULT_POLICY_FILE} found; using soft default policy`
  };
}
