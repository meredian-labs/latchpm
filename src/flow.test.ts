import { describe, expect, it } from "vitest";
import { planAfterAudit } from "./flow.js";

describe("planAfterAudit", () => {
  it("blocks install when policy denies the package", () => {
    expect(planAfterAudit("install", { yes: true }, { allowed: false })).toEqual({
      action: "policy-denied",
      code: 3,
      installMode: "denied"
    });
  });

  it("does not install in --ci without --yes", () => {
    expect(planAfterAudit("install", { ci: true }, { allowed: true })).toEqual({
      action: "report-only",
      installMode: "report-only"
    });
  });

  it("does not run ci in --ci without --yes", () => {
    expect(planAfterAudit("ci", { ci: true }, { allowed: true })).toEqual({
      action: "report-only",
      installMode: "report-only"
    });
  });

  it("runs ci in --ci --yes when policy allows", () => {
    expect(planAfterAudit("ci", { ci: true, yes: true }, { allowed: true })).toEqual({
      action: "install",
      installMode: "normal"
    });
  });

  it("installs normally in --ci --yes when policy allows", () => {
    expect(planAfterAudit("install", { ci: true, yes: true }, { allowed: true })).toEqual({
      action: "install",
      installMode: "normal"
    });
  });

  it("installs with scripts disabled when requested", () => {
    expect(planAfterAudit("install", { ci: true, yes: true, ignoreScripts: true }, { allowed: true })).toEqual({
      action: "install",
      installMode: "ignore-scripts"
    });
  });

  it("exits audit commands in CI based on policy", () => {
    expect(planAfterAudit("audit", { ci: true }, { allowed: false })).toEqual({
      action: "exit",
      code: 3,
      installMode: "report-only"
    });
  });
});
