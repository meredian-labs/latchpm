import { describe, expect, it } from "vitest";
import { installAliases, removeAliases } from "./flow.js";

describe("commands", () => {
  it("supports add as an alias for install", () => {
    expect(installAliases).toContain("add");
  });

  it("supports uninstall as an alias for remove", () => {
    expect(removeAliases).toContain("uninstall");
  });
});
