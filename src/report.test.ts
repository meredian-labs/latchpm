import { describe, expect, it } from "vitest";
import { createLatchpmInstallReport, createLatchpmReport, formatLatchpmReport } from "./report.js";
import { createTestAuditReport } from "./testReport.js";

describe("latchpm reports", () => {
  it("includes Cloud-ready install metadata", () => {
    const report = createLatchpmInstallReport(createTestAuditReport(), "ignore-scripts");

    expect(report.tool).toBe("latchpm");
    expect(report.action).toBe("install");
    expect(report.install).toEqual({
      requestedSpec: "zod",
      resolvedInstallSpec: "zod@3.25.67",
      installMode: "ignore-scripts"
    });
  });

  it("includes tool and action metadata for report-only commands", () => {
    const report = createLatchpmReport(createTestAuditReport({ action: "audit" }), "inspect");

    expect(report.tool).toBe("latchpm");
    expect(report.action).toBe("inspect");
    expect(report.install).toBeUndefined();
  });

  it("formats latchpm with the same name typography as latchx", () => {
    const output = formatLatchpmReport(createLatchpmInstallReport(createTestAuditReport(), "report-only"));

    expect(output).toContain("LatchPM Pre-Install Report");
    expect(output).toContain("Resolved install spec: zod@3.25.67");
  });

  it("formats audit and inspect reports with LatchPM typography", () => {
    const output = formatLatchpmReport(createLatchpmReport(createTestAuditReport({ action: "audit" }), "inspect"));

    expect(output).toContain("LatchPM Preflight Report");
  });

  it("keeps JSON output parseable", () => {
    const report = createLatchpmInstallReport(createTestAuditReport(), "report-only");
    const json = JSON.stringify(report, null, 2);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("\"tool\": \"latchpm\"");
  });
});
