import { spawn } from "node:child_process";
import type { LatchAuditReport } from "latch-core";

export type InstallMode = "normal" | "ignore-scripts" | "report-only" | "denied";

export type NpmInstallCommand = {
  command: "npm";
  args: string[];
};

export type NpmCommand = NpmInstallCommand;

export function buildResolvedInstallSpec(report: Pick<LatchAuditReport, "package">): string {
  return `${report.package.name}@${report.package.resolvedVersion}`;
}

export function buildNpmInstallCommand(packageSpec: string, installMode: InstallMode): NpmInstallCommand {
  if (installMode === "normal") {
    return { command: "npm", args: ["install", packageSpec] };
  }

  if (installMode === "ignore-scripts") {
    return { command: "npm", args: ["install", packageSpec, "--ignore-scripts"] };
  }

  throw new Error(`Install mode ${installMode} does not run npm install.`);
}

export function buildNpmProjectInstallCommand(): NpmCommand {
  return { command: "npm", args: ["install"] };
}

export function buildNpmCiCommand(): NpmCommand {
  return { command: "npm", args: ["ci"] };
}

export function buildNpmRemoveCommand(packageName: string): NpmCommand {
  return { command: "npm", args: ["uninstall", packageName] };
}

export function buildNpmRunCommand(scriptName: string, args: string[]): NpmCommand {
  return { command: "npm", args: ["run", scriptName, "--", ...args] };
}

export function buildNpmPassthroughCommand(args: string[]): NpmCommand {
  return { command: "npm", args };
}

export function formatNpmPassthroughWarning(): string {
  return "No Latch audit is applied to explicit npm passthrough commands.";
}

export function formatNpmCommand(command: NpmCommand): string {
  return [command.command, ...command.args.map(formatArg)].join(" ");
}

export async function runNpmInstall(packageSpec: string, installMode: InstallMode): Promise<number> {
  return runNpmCommand(buildNpmInstallCommand(packageSpec, installMode));
}

export async function runNpmCommand(command: NpmCommand): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function formatArg(arg: string): string {
  if (/^[A-Za-z0-9._/@:=+-]+$/.test(arg)) {
    return arg;
  }

  return JSON.stringify(arg);
}
