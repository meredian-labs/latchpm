import { describe, expect, it } from "vitest";
import {
  buildNpmCiCommand,
  buildNpmInstallCommand,
  buildNpmPassthroughCommand,
  buildNpmProjectInstallCommand,
  buildNpmRemoveCommand,
  buildNpmRunCommand,
  buildResolvedInstallSpec,
  formatNpmPassthroughWarning,
  formatNpmCommand
} from "./installRunner.js";
import { createTestAuditReport } from "./testReport.js";

describe("install runner", () => {
  it("resolves the install spec from the exact inspected version", () => {
    const report = createTestAuditReport();

    expect(buildResolvedInstallSpec(report)).toBe("zod@3.25.67");
  });

  it("generates a normal npm install command", () => {
    expect(buildNpmInstallCommand("zod@3.25.67", "normal")).toEqual({
      command: "npm",
      args: ["install", "zod@3.25.67"]
    });
  });

  it("generates an npm install command with scripts disabled", () => {
    expect(buildNpmInstallCommand("zod@3.25.67", "ignore-scripts")).toEqual({
      command: "npm",
      args: ["install", "zod@3.25.67", "--ignore-scripts"]
    });
  });

  it("generates a remove command", () => {
    expect(buildNpmRemoveCommand("zod")).toEqual({
      command: "npm",
      args: ["uninstall", "zod"]
    });
  });

  it("generates project install and ci commands", () => {
    expect(buildNpmProjectInstallCommand()).toEqual({ command: "npm", args: ["install"] });
    expect(buildNpmCiCommand()).toEqual({ command: "npm", args: ["ci"] });
  });

  it("generates npm run commands with args after --", () => {
    expect(buildNpmRunCommand("test", ["--watch"])).toEqual({
      command: "npm",
      args: ["run", "test", "--", "--watch"]
    });
  });

  it("generates passthrough npm commands and formats them", () => {
    const command = buildNpmPassthroughCommand(["view", "react", "version"]);

    expect(command).toEqual({ command: "npm", args: ["view", "react", "version"] });
    expect(formatNpmCommand(command)).toBe("npm view react version");
    expect(formatNpmPassthroughWarning()).toContain("No Latch audit is applied");
  });
});
