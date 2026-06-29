import type { LatchAuditReport } from "latch-core";
import type { LatchpmAction } from "./flow.js";
import { type InstallMode } from "./installRunner.js";
export type LatchpmAuditAction = Extract<LatchpmAction, "audit" | "inspect" | "install">;
export type LatchpmInstallMetadata = {
    requestedSpec: string;
    resolvedInstallSpec: string;
    installMode: InstallMode;
};
export type LatchpmReport = LatchAuditReport & {
    install?: LatchpmInstallMetadata;
};
export declare function createLatchpmReport(report: LatchAuditReport, action: LatchpmAuditAction): LatchpmReport;
export declare function createLatchpmInstallReport(report: LatchAuditReport, installMode: InstallMode): LatchpmReport;
export declare function formatLatchpmReport(report: LatchpmReport): string;
