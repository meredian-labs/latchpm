import type { LatchPolicy, PolicyDecision } from "latch-core";
import type { DirectDependency } from "./projectDeps.js";
import type { LatchpmReport } from "./report.js";
import type { NpmCommand } from "./installRunner.js";
export type ProjectDependencyAudit = {
    dependency: DirectDependency;
    report: LatchpmReport;
    policyDecision: PolicyDecision;
};
export type ProjectWorkflowReport = {
    tool: "latchpm";
    action: "install" | "ci";
    generatedAt: string;
    command: NpmCommand;
    auditScope: {
        directDependencies: number;
        transitiveAudit: false;
        note: string;
    };
    policy: {
        allowed: boolean;
        reason: string;
        violations: string[];
        effectivePolicy: LatchPolicy;
    };
    dependencies: ProjectDependencyAudit[];
};
export declare function createProjectWorkflowReport(input: {
    action: "install" | "ci";
    command: NpmCommand;
    dependencies: ProjectDependencyAudit[];
}): ProjectWorkflowReport;
export declare function formatProjectWorkflowReport(report: ProjectWorkflowReport): string;
