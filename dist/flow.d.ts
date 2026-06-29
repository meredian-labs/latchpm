import type { PolicyDecision } from "latch-core";
import type { InstallMode } from "./installRunner.js";
export type LatchpmAction = "audit" | "inspect" | "install" | "ci";
export declare const installAliases: readonly ["add"];
export declare const removeAliases: readonly ["uninstall"];
export type FlowOptions = {
    ci?: boolean;
    yes?: boolean;
    ignoreScripts?: boolean;
};
export type FlowPlan = {
    action: "exit";
    code: 0 | 3;
    installMode: InstallMode;
} | {
    action: "report-only";
    installMode: InstallMode;
} | {
    action: "policy-denied";
    code: 3;
    installMode: InstallMode;
} | {
    action: "install";
    installMode: Extract<InstallMode, "normal" | "ignore-scripts">;
} | {
    action: "prompt";
    installMode: InstallMode;
};
export declare function planAfterAudit(action: LatchpmAction, options: FlowOptions, policyDecision: Pick<PolicyDecision, "allowed">): FlowPlan;
