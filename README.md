# latchpm

`latchpm` is a narrow local safer npm workflow wrapper.

It audits packages before installation, shows pre-install reports, evaluates local policy, and only then delegates to npm.

`latchpm` is not a full npm replacement. It is the install-side companion to `latchx`:

- `latchx`: audit before run
- `latchpm`: audit before install

## Package Install Flow

```text
1. Parse the package spec.
2. Resolve npm package metadata through latch-core.
3. Resolve the exact inspected version.
4. Audit the package through the latch-core pipeline.
5. Show a pre-install report.
6. Evaluate local policy.
7. Ask for a decision.
8. Run npm install only after approval.
```

The installed version must match the inspected version.

## Usage

Audit without installing:

```bash
latchpm audit zod
latchpm inspect zod
```

Install after approval:

```bash
latchpm install zod
latchpm add zod
```

The interactive decision screen offers:

- install normally
- install with `--ignore-scripts`
- deny
- view findings
- print JSON

Non-interactive install:

```bash
latchpm install zod --yes
latchpm install zod --yes --ignore-scripts
```

Project install audits direct dependencies from `package.json` before running `npm install`:

```bash
latchpm install
latchpm install --yes
```

This version audits direct dependencies only. Transitive dependency auditing is not implemented yet.

Run `npm ci` after auditing direct dependencies from `package.json` and `package-lock.json` when available:

```bash
latchpm ci
latchpm ci --yes
```

Remove packages:

```bash
latchpm remove zod
latchpm uninstall zod
latchpm remove zod --yes
```

Remove/uninstall does not run an audit. It shows the npm command before delegating to `npm uninstall`.

Run scripts:

```bash
latchpm run test
latchpm run test -- --watch
latchpm run test --yes
```

`latchpm run` reads `package.json`, shows the script command, asks for approval unless `--yes` is used, then delegates to `npm run`.

Explicit npm passthrough:

```bash
latchpm npm view react version
```

This is an escape hatch for unsupported npm commands. No Latch audit is applied.

## CI And Agent Usage

CI mode is deterministic and does not prompt.

```bash
latchpm audit zod --json --ci --policy ./latch.policy.json
```

`latchpm install <package> --json --ci` reports only. It does not install unless `--yes` is present.

```bash
latchpm install zod --json --ci
latchpm install zod --ci --yes
latchpm install zod --ci --yes --ignore-scripts
latchpm install --json --ci
latchpm install --ci --yes
latchpm ci --json --ci
latchpm ci --ci --yes
```

Exit codes:

- `0`: allowed
- `1`: general error
- `2`: denied by user
- `3`: denied by policy
- `4`: package not found
- `5`: registry/network error
- `6`: integrity verification failed
- `7`: analysis failed

## Policy Examples

Strict policy:

```json
{
  "minScore": 85,
  "denyCritical": true,
  "denyHigh": true,
  "denyLifecycleScripts": true,
  "denyNewLifecycleScripts": true,
  "denyLikelyObfuscation": true,
  "denyIntegrityMissing": true,
  "allowedRegistries": ["https://registry.npmjs.org"]
}
```

Relaxed policy with trusted scope:

```json
{
  "minScore": 60,
  "denyCritical": true,
  "trustedScopes": ["@your-org"],
  "allowedRegistries": ["https://registry.npmjs.org"]
}
```

See `examples/policies/` in the repository for ready-to-use policy files.

## Cache And Doctor

```bash
latchpm doctor
latchpm cache status
latchpm cache path
latchpm cache clear
```

`latchpm` uses the shared Latch cache under:

```text
~/.latch/cache
```

## JSON Report Metadata

Install reports include metadata for future Cloud use:

```json
{
  "tool": "latchpm",
  "action": "install",
  "install": {
    "requestedSpec": "zod",
    "resolvedInstallSpec": "zod@3.25.67",
    "installMode": "report-only"
  }
}
```

Project install and `ci` reports include:

```json
{
  "tool": "latchpm",
  "action": "install",
  "auditScope": {
    "directDependencies": 1,
    "transitiveAudit": false,
    "note": "This version audits direct dependencies only. Transitive dependency auditing is not implemented yet."
  }
}
```

`installMode` can be:

- `normal`
- `ignore-scripts`
- `report-only`
- `denied`

## Limitations

- No Cloud dependency.
- No registry/proxy.
- No marketplace.
- No sandboxing.
- No full npm replacement.
- No full project-level install auditing.
- Project `install` and `ci` audit direct dependencies only.
- Remove, run, and explicit npm passthrough commands do not run package audits.
- Static scanning can miss behavior and can produce false positives.

## Release

Release validation:

```bash
npm install
npm run typecheck
npm run build
npm test
npm pack -w @meredian-labs/latchpm --dry-run
```
