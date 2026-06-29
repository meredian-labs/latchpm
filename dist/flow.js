export const installAliases = ["add"];
export const removeAliases = ["uninstall"];
export function planAfterAudit(action, options, policyDecision) {
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
//# sourceMappingURL=flow.js.map