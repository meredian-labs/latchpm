import { formatHumanReport } from "latch-core";
import { buildResolvedInstallSpec } from "./installRunner.js";
export function createLatchpmReport(report, action) {
    return {
        ...report,
        tool: "latchpm",
        action
    };
}
export function createLatchpmInstallReport(report, installMode) {
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
export function formatLatchpmReport(report) {
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
function withLatchpmTitle(output, report) {
    const title = report.action === "install" ? "LatchPM Pre-Install Report" : "LatchPM Preflight Report";
    return output.replace(/^(LatchX Preflight Report|Latch Preflight Report|LatchPM Preflight Report|LatchPM Pre-Install Report)/, title);
}
//# sourceMappingURL=report.js.map