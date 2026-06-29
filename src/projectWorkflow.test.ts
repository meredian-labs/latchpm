import { describe, expect, it } from "vitest";
import { buildNpmCiCommand, buildNpmProjectInstallCommand } from "./installRunner.js";
import { createProjectWorkflowReport, formatProjectWorkflowReport } from "./projectWorkflow.js";
import { createLatchpmReport } from "./report.js";
import { createTestAuditReport } from "./testReport.js";

describe("project workflow reports", () => {
  it("reports direct dependency audit scope and policy", () => {
    const report = createProjectWorkflowReport({
      action: "install",
      command: buildNpmProjectInstallCommand(),
      dependencies: [
        {
          dependency: {
            name: "zod",
            requestedRange: "^4.0.0",
            requestedSpec: "zod@^4.0.0",
            category: "dependencies"
          },
          report: createLatchpmReport(createTestAuditReport(), "install"),
          policyDecision: {
            allowed: true,
            reason: "Allowed by policy.",
            violations: [],
            policy: {},
            trusted: false
          }
        }
      ]
    });

    expect(report.auditScope).toMatchObject({
      directDependencies: 1,
      transitiveAudit: false
    });
    expect(formatProjectWorkflowReport(report)).toContain("Transitive dependency audit: not implemented yet");
    expect(() => JSON.parse(JSON.stringify(report))).not.toThrow();
  });

  it("marks project ci report as denied when a dependency policy denies", () => {
    const report = createProjectWorkflowReport({
      action: "ci",
      command: buildNpmCiCommand(),
      dependencies: [
        {
          dependency: {
            name: "zod",
            requestedRange: "^4.0.0",
            requestedSpec: "zod@^4.0.0",
            category: "dependencies"
          },
          report: createLatchpmReport(createTestAuditReport(), "install"),
          policyDecision: {
            allowed: false,
            reason: "Risk level high is denied by policy.",
            violations: ["Risk level high is denied by policy."],
            policy: { denyHigh: true },
            trusted: false
          }
        }
      ]
    });

    expect(report.policy.allowed).toBe(false);
    expect(report.policy.reason).toContain("zod");
  });
});
