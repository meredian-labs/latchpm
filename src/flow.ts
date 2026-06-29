import type { PolicyDecision } from "latch-core";
import type { InstallMode } from "./installRunner.js";

export type LatchpmAction = "audit" | "inspect" | "install" | "ci";

export const installAliases = ["add"] as const;
export const removeAliases = ["uninstall"] as const;

export type FlowOptions = {
  ci?: boolean;
  yes?: boolean;
  ignoreScripts?: boolean;
};

export type FlowPlan =
  | { action: "exit"; code: 0 | 3; installMode: InstallMode }
  | { action: "report-only"; installMode: InstallMode }
  | { action: "policy-denied"; code: 3; installMode: InstallMode }
  | { action: "install"; installMode: Extract<InstallMode, "normal" | "ignore-scripts"> }
  | { action: "prompt"; installMode: InstallMode };

export function planAfterAudit(
  action: LatchpmAction,
  options: FlowOptions,
  policyDecision: Pick<PolicyDecision, "allowed">
): FlowPlan {
  if (action !== "install" && action !== "ci") {
    if (options.ci) {
      return { action: "exit", code: policyDecision.allowed ? 0 : 3, installMode: "report-only" };
    }

    return { action: "report-only", installMode: "report-only" };
  }

  if (!policyDecision.allowed) {
    return { action: "policy-denied", code: 3, installMode: "denied" };
  }

  if (options.ci && !options.yes) {
    return { action: "report-only", installMode: "report-only" };
  }

  if (options.yes) {
    return { action: "install", installMode: options.ignoreScripts ? "ignore-scripts" : "normal" };
  }

  return { action: "prompt", installMode: "report-only" };
}
