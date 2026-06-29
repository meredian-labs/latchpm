import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("documentation examples", () => {
  it("keeps README sections for install usage and publishability", async () => {
    const readme = await readFile("README.md", "utf8");

    expect(readme).toContain("# latchpm");
    expect(readme).toContain("## Package Install Flow");
    expect(readme).toContain("## Usage");
    expect(readme).toContain("## CI And Agent Usage");
    expect(readme).toContain("## Policy Examples");
    expect(readme).toContain("## Limitations");
    expect(readme).toContain("latchpm ci --json --ci");
    expect(readme).toContain("latchpm npm view react version");
    expect(readme).toContain("npm pack -w @meredian-labs/latchpm --dry-run");
  });

  it("parses policy example files", async () => {
    const files = ["strict.policy.json", "relaxed.policy.json", "deny-lifecycle.policy.json"];

    for (const file of files) {
      const raw = await readFile(`../../examples/policies/${file}`, "utf8");
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
});
