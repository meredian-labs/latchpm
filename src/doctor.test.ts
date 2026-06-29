import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkNodeVersion, formatDoctorReport, runDoctor } from "./doctor.js";

describe("doctor", () => {
  it("plans node readiness from version", () => {
    expect(checkNodeVersion("20.20.0").ok).toBe(true);
    expect(checkNodeVersion("16.0.0").ok).toBe(false);
  });

  it("formats readiness output", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "latchpm-doctor-"));
    const cachePath = await mkdtemp(join(tmpdir(), "latchpm-doctor-cache-"));
    await writeFile(join(cwd, "latch.policy.json"), "{}");
    const fetchImpl = async () => new Response("ok", { status: 200 });

    const report = await runDoctor({ cwd, cachePath, fetchImpl });
    const output = formatDoctorReport(report);

    expect(report.ready).toBe(true);
    expect(output).toContain("LatchPM Doctor");
    expect(output).toContain("policy");
    expect(output).toContain("Status: ready");
  });
});
