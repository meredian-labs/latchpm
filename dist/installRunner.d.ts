import type { LatchAuditReport } from "latch-core";
export type InstallMode = "normal" | "ignore-scripts" | "report-only" | "denied";
export type NpmInstallCommand = {
    command: "npm";
    args: string[];
};
export type NpmCommand = NpmInstallCommand;
export declare function buildResolvedInstallSpec(report: Pick<LatchAuditReport, "package">): string;
export declare function buildNpmInstallCommand(packageSpec: string, installMode: InstallMode): NpmInstallCommand;
export declare function buildNpmProjectInstallCommand(): NpmCommand;
export declare function buildNpmCiCommand(): NpmCommand;
export declare function buildNpmRemoveCommand(packageName: string): NpmCommand;
export declare function buildNpmRunCommand(scriptName: string, args: string[]): NpmCommand;
export declare function buildNpmPassthroughCommand(args: string[]): NpmCommand;
export declare function formatNpmPassthroughWarning(): string;
export declare function formatNpmCommand(command: NpmCommand): string;
export declare function runNpmInstall(packageSpec: string, installMode: InstallMode): Promise<number>;
export declare function runNpmCommand(command: NpmCommand): Promise<number>;
