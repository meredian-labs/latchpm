import { formatHumanReport } from "latch-core";
import type { LatchAuditReport } from "latch-core";
import type { LatchpmAction } from "./flow.js";
import { buildResolvedInstallSpec, type InstallMode } from "./installRunner.js";

export type LatchpmAuditAction = Extract<LatchpmAction, "audit" | "inspect" | "install">;

export type LatchpmInstallMetadata = {
  requestedSpec: string;
  resolvedInstallSpec: string;
  installMode: InstallMode;
};

export type LatchpmReport = LatchAuditReport & {
  install?: LatchpmInstallMetadata;
};

export function createLatchpmReport(report: LatchAuditReport, action: LatchpmAuditAction): LatchpmReport {
  return {
    ...report,
    tool: "latchpm",
    action
  };
}

export function createLatchpmInstallReport(report: LatchAuditReport, installMode: InstallMode): LatchpmReport {
  const normalized = createLatchpmReport(report, "install");

  return {
    ...normalized,
    install: {
      requestedSpec: normalized.package.requestedSpec,
      resolvedInstallSpec: buildResolvedInstallSpec(normalized),
      installMode
    }
  };
}

export function formatLatchpmReport(report: LatchpmReport): string {
  const base = withLatchpmTitle(formatHumanReport(report), report);
  if (!report.install) {
    return base;
  }

  return [
    base,
    "Install",
    `  Requested spec: ${report.install.requestedSpec}`,
    `  Resolved install spec: ${report.install.resolvedInstallSpec}`,
    `  Install mode: ${report.install.installMode}`,
    ""
  ].join("\n");
}

function withLatchpmTitle(output: string, report: LatchpmReport): string {
  const title = report.action === "install" ? "LatchPM Pre-Install Report" : "LatchPM Preflight Report";
  return output.replace(/^(LatchX Preflight Report|Latch Preflight Report|LatchPM Preflight Report|LatchPM Pre-Install Report)/, title);
}
