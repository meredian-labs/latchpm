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

export function createProjectWorkflowReport(input: {
  action: "install" | "ci";
  command: NpmCommand;
  dependencies: ProjectDependencyAudit[];
}): ProjectWorkflowReport {
  const denied = input.dependencies.find((dependency) => !dependency.policyDecision.allowed);
  const violations = input.dependencies.flatMap((dependency) =>
    dependency.policyDecision.violations.map((violation) => `${dependency.dependency.name}: ${violation}`)
  );

  return {
    tool: "latchpm",
    action: input.action,
    generatedAt: new Date().toISOString(),
    command: input.command,
    auditScope: {
      directDependencies: input.dependencies.length,
      transitiveAudit: false,
      note: "This version audits direct dependencies only. Transitive dependency auditing is not implemented yet."
    },
    policy: {
      allowed: !denied,
      reason: denied ? `${denied.dependency.name}: ${denied.policyDecision.reason}` : "Allowed by policy.",
      violations,
      effectivePolicy: input.dependencies[0]?.policyDecision.policy ?? {}
    },
    dependencies: input.dependencies
  };
}

export function formatProjectWorkflowReport(report: ProjectWorkflowReport): string {
  const lines = [
    report.action === "ci" ? "LatchPM CI Report" : "LatchPM Project Install Report",
    "",
    "Scope",
    `  Direct dependencies audited: ${report.auditScope.directDependencies}`,
    "  Transitive dependency audit: not implemented yet",
    `  Note: ${report.auditScope.note}`,
    "",
    "Command",
    `  ${report.command.command} ${report.command.args.join(" ")}`,
    "",
    "Policy",
    `  ${report.policy.allowed ? "allow" : "deny"} - ${report.policy.reason}`,
    "",
    "Dependencies",
    ...formatDependencies(report),
    ""
  ];

  return lines.join("\n");
}

function formatDependencies(report: ProjectWorkflowReport): string[] {
  if (!report.dependencies.length) {
    return ["  none"];
  }

  return report.dependencies.map((dependency) => {
    const audit = dependency.report;
    return `  - ${dependency.dependency.name} (${dependency.dependency.category}, ${dependency.dependency.requestedSpec}): ${audit.risk.score}/100 ${audit.risk.level}, policy ${dependency.policyDecision.allowed ? "allow" : "deny"}`;
  });
}
