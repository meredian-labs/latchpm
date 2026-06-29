import type { LatchAuditReport } from "latch-core";

export function createTestAuditReport(overrides: Partial<LatchAuditReport> = {}): LatchAuditReport {
  return {
    tool: "latchpm",
    action: "install",
    generatedAt: "2026-06-29T00:00:00.000Z",
    registry: {
      url: "https://registry.npmjs.org"
    },
    package: {
      name: "zod",
      requestedSpec: "zod",
      resolvedVersion: "3.25.67",
      tarballUrl: "https://registry.npmjs.org/zod/-/zod-3.25.67.tgz",
      integrity: "sha512-test",
      publishedAt: "2026-01-01T00:00:00.000Z"
    },
    identity: {
      publisher: {
        name: "publisher"
      },
      maintainers: [],
      repository: "https://github.com/colinhacks/zod",
      license: "MIT"
    },
    size: {
      tarballBytes: 1024,
      unpackedBytes: 2048,
      fileCount: 10
    },
    execution: {
      hasBin: false,
      bin: null,
      hasLifecycleScripts: false,
      lifecycleScripts: []
    },
    dependencies: {
      dependencies: 0,
      devDependencies: 0,
      optionalDependencies: 0,
      peerDependencies: 0,
      bundledDependencies: 0
    },
    scan: {
      scannedFiles: 10,
      skippedFiles: 0,
      totalFiles: 10,
      suspiciousPatterns: [],
      obfuscation: {
        level: "none",
        files: []
      }
    },
    diff: {
      previousVersion: "3.25.66",
      scriptsAdded: [],
      scriptsRemoved: [],
      scriptsChanged: [],
      dependenciesAdded: [],
      dependenciesRemoved: [],
      binChanged: false
    },
    risk: {
      score: 95,
      level: "low",
      findings: []
    },
    decision: {
      recommended: "allow",
      reason: "No high-risk scanner signals were found."
    },
    ...overrides
  };
}
