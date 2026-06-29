#!/usr/bin/env node
import { Command } from "commander";
import prompts from "prompts";
import { auditPackage, evaluatePolicy, formatHumanReport, loadPolicy } from "latch-core";
import { clearCache, formatCacheStatus, getCacheStatus, getDefaultCachePath } from "./cacheCommands.js";
import { formatDoctorReport, runDoctor } from "./doctor.js";
import { installAliases, planAfterAudit, removeAliases } from "./flow.js";
import { buildNpmCiCommand, buildNpmPassthroughCommand, buildNpmProjectInstallCommand, buildNpmRemoveCommand, buildResolvedInstallSpec, formatNpmPassthroughWarning, formatNpmCommand, runNpmCommand, runNpmInstall } from "./installRunner.js";
import { readDirectDependencies } from "./projectDeps.js";
import { createProjectWorkflowReport, formatProjectWorkflowReport } from "./projectWorkflow.js";
import { createLatchpmInstallReport, createLatchpmReport, formatLatchpmReport } from "./report.js";
import { resolveScript } from "./scriptRunner.js";
const exitCodes = {
    generalError: 1,
    deniedByUser: 2,
    deniedByPolicy: 3,
    packageNotFound: 4,
    registryError: 5,
    integrityFailed: 6,
    analysisFailed: 7
};
const program = new Command();
program
    .name("latchpm")
    .description("Inspect npm packages before installing them.")
    .option("--json", "output structured JSON")
    .option("-y, --yes", "approve install without prompting")
    .option("--ci", "evaluate policy without prompts")
    .option("--policy <path>", "policy file path")
    .option("--registry <url>", "npm registry URL")
    .option("--no-cache", "force re-analysis")
    .allowUnknownOption(false);
addInstallCommand();
addAuditCommand("audit", "Audit a package without installing it.");
addAuditCommand("inspect", "Inspect a package without installing it.");
addCiCommand();
addRemoveCommand();
addRunCommand();
addNpmPassthroughCommand();
addDoctorCommand();
addCacheCommands();
program.parseAsync(process.argv).catch((error) => {
    handleError(error);
});
function addInstallCommand() {
    const install = program
        .command("install")
        .description("Audit a package or direct project dependencies and install only after approval.")
        .argument("[packageSpec]", "package spec to install")
        .option("--json", "output structured JSON")
        .option("-y, --yes", "approve install without prompting")
        .option("--ci", "evaluate policy without prompts")
        .option("--policy <path>", "policy file path")
        .option("--registry <url>", "npm registry URL")
        .option("--no-cache", "force re-analysis")
        .option("--ignore-scripts", "install with npm --ignore-scripts after approval")
        .action(async (packageSpec, ...rest) => {
        const options = mergeOptions(actionOptions(...rest));
        if (packageSpec) {
            await handlePackage("install", packageSpec, options);
            return;
        }
        await handleProjectCommand("install", options, buildNpmProjectInstallCommand(), { preferLockfile: false });
    });
    for (const alias of installAliases) {
        install.alias(alias);
    }
}
function addCiCommand() {
    program
        .command("ci")
        .description("Audit direct project dependencies and run npm ci only after approval.")
        .option("--json", "output structured JSON")
        .option("-y, --yes", "approve npm ci without prompting")
        .option("--ci", "evaluate policy without prompts")
        .option("--policy <path>", "policy file path")
        .option("--registry <url>", "npm registry URL")
        .option("--no-cache", "force re-analysis")
        .action(async (...rest) => {
        await handleProjectCommand("ci", mergeOptions(actionOptions(...rest)), buildNpmCiCommand(), { preferLockfile: true });
    });
}
function addRemoveCommand() {
    const remove = program
        .command("remove")
        .description("Delegate to npm uninstall after showing the command.")
        .argument("<packageName>", "package name to uninstall")
        .option("-y, --yes", "approve uninstall without prompting")
        .action(async (packageName, ...rest) => {
        await handleUnauditedCommand(buildNpmRemoveCommand(packageName), mergeOptions(actionOptions(...rest)), {
            title: "Remove package",
            warning: "No Latch audit is applied to remove or uninstall commands."
        });
    });
    for (const alias of removeAliases) {
        remove.alias(alias);
    }
}
function addRunCommand() {
    program
        .command("run")
        .description("Show a package.json script before delegating to npm run.")
        .argument("<scriptName>", "package.json script to run")
        .argument("[scriptArgs...]", "arguments to pass after --")
        .option("-y, --yes", "approve script execution without prompting")
        .option("--json", "output structured JSON")
        .allowUnknownOption(true)
        .action(async (scriptName, scriptArgs = [], ...rest) => {
        const options = mergeOptions(actionOptions(...rest));
        const resolved = await resolveScript(scriptName, scriptArgs);
        const report = {
            tool: "latchpm",
            action: "run",
            script: {
                name: resolved.name,
                command: resolved.command
            },
            npmCommand: resolved.npmCommand
        };
        if (options.json) {
            process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        }
        else {
            process.stdout.write(["LatchPM Run", `  Script: ${resolved.name}`, `  Command: ${resolved.command}`, ""].join("\n"));
        }
        await maybeRunUnauditedCommand(resolved.npmCommand, options, "Run script");
    });
}
function addNpmPassthroughCommand() {
    program
        .command("npm")
        .description("Explicit npm passthrough escape hatch. No Latch audit is applied.")
        .argument("[npmArgs...]", "arguments to pass to npm")
        .allowUnknownOption(true)
        .action(async (npmArgs = [], ...rest) => {
        if (!npmArgs.length) {
            throw new Error("No npm arguments provided.");
        }
        const command = buildNpmPassthroughCommand(npmArgs);
        process.stderr.write(`latchpm: ${formatNpmPassthroughWarning()}\n`);
        printCommandBeforeExecution(command);
        process.exit(await runNpmCommand(command));
    });
}
function addAuditCommand(name, description) {
    program
        .command(name)
        .description(description)
        .argument("<packageSpec>", "package spec to audit")
        .option("--json", "output structured JSON")
        .option("--ci", "evaluate policy without prompts")
        .option("--policy <path>", "policy file path")
        .option("--registry <url>", "npm registry URL")
        .option("--no-cache", "force re-analysis")
        .action(async (packageSpec, ...rest) => {
        await handlePackage(name, packageSpec, mergeOptions(actionOptions(...rest)));
    });
}
function addDoctorCommand() {
    program
        .command("doctor")
        .description("Check local latchpm readiness.")
        .option("--registry <url>", "npm registry URL")
        .option("--json", "output structured JSON")
        .action(async (...rest) => {
        const options = mergeOptions(actionOptions(...rest));
        const report = await runDoctor({ registryUrl: options.registry });
        if (options.json) {
            process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        }
        else {
            process.stdout.write(`${formatDoctorReport(report)}\n`);
        }
        process.exit(report.ready ? 0 : exitCodes.generalError);
    });
}
function addCacheCommands() {
    const cache = program.command("cache").description("Inspect or clear the local latchpm cache.");
    cache
        .command("status")
        .description("Show local cache status.")
        .option("--json", "output structured JSON")
        .action(async (...rest) => {
        const options = mergeOptions(actionOptions(...rest));
        const status = await getCacheStatus();
        process.stdout.write(options.json ? `${JSON.stringify(status, null, 2)}\n` : `${formatCacheStatus(status)}\n`);
    });
    cache
        .command("path")
        .description("Print local cache path.")
        .action(() => {
        process.stdout.write(`${getDefaultCachePath()}\n`);
    });
    cache
        .command("clear")
        .description("Clear local latchpm cache.")
        .option("--json", "output structured JSON")
        .action(async (...rest) => {
        const options = mergeOptions(actionOptions(...rest));
        const status = await clearCache();
        process.stdout.write(options.json ? `${JSON.stringify(status, null, 2)}\n` : `${formatCacheStatus(status)}\n`);
    });
}
async function handlePackage(action, packageSpec, options) {
    const auditReport = await auditPackage(packageSpec, {
        tool: "latchpm",
        action,
        registryUrl: options.registry,
        noCache: shouldBypassCache(options)
    });
    const policy = await loadPolicy(options.policy);
    const policyDecision = evaluatePolicy(auditReport, policy.policy);
    const plan = planAfterAudit(action, options, policyDecision);
    const report = action === "install" ? createLatchpmInstallReport(auditReport, plan.installMode) : createLatchpmReport(auditReport, action);
    emitReport(report, options);
    if (!policyDecision.allowed) {
        process.stderr.write(`latchpm policy: ${policyDecision.reason}\n`);
    }
    if (plan.action === "exit") {
        process.exit(plan.code);
    }
    if (plan.action === "report-only") {
        return;
    }
    if (plan.action === "policy-denied") {
        process.exit(plan.code);
    }
    if (plan.action === "prompt") {
        const decision = await askForDecision(createLatchpmInstallReport(auditReport, "report-only"), policyDecision);
        if (decision === "denied") {
            process.exit(exitCodes.deniedByUser);
        }
        const code = await runNpmInstall(buildResolvedInstallSpec(auditReport), decision);
        process.exit(code);
    }
    const code = await runNpmInstall(buildResolvedInstallSpec(auditReport), plan.installMode);
    process.exit(code);
}
async function handleProjectCommand(action, options, command, dependencyOptions) {
    const dependencies = await readDirectDependencies(process.cwd(), dependencyOptions);
    const policy = await loadPolicy(options.policy);
    const audits = [];
    for (const dependency of dependencies) {
        const auditAction = action === "ci" ? "install" : action;
        const auditReport = await auditPackage(dependency.requestedSpec, {
            tool: "latchpm",
            action: auditAction,
            registryUrl: options.registry,
            noCache: shouldBypassCache(options)
        });
        const report = createLatchpmReport(auditReport, auditAction);
        audits.push({
            dependency,
            report,
            policyDecision: evaluatePolicy(report, policy.policy)
        });
    }
    const report = createProjectWorkflowReport({ action, command, dependencies: audits });
    emitReport(report, options);
    if (!report.policy.allowed) {
        process.stderr.write(`latchpm policy: ${report.policy.reason}\n`);
    }
    const plan = planAfterAudit(action, options, { allowed: report.policy.allowed });
    if (plan.action === "report-only") {
        return;
    }
    if (plan.action === "policy-denied") {
        process.exit(plan.code);
    }
    if (plan.action === "prompt") {
        const approved = await askForCommandApproval("Project install", command);
        if (!approved) {
            process.exit(exitCodes.deniedByUser);
        }
    }
    printCommandBeforeExecution(command);
    process.exit(await runNpmCommand(command));
}
async function handleUnauditedCommand(command, options, labels) {
    process.stderr.write(`latchpm: ${labels.warning}\n`);
    await maybeRunUnauditedCommand(command, options, labels.title);
}
async function maybeRunUnauditedCommand(command, options, title) {
    if (!options.yes) {
        const approved = await askForCommandApproval(title, command);
        if (!approved) {
            process.exit(exitCodes.deniedByUser);
        }
    }
    printCommandBeforeExecution(command);
    process.exit(await runNpmCommand(command));
}
function emitReport(report, options) {
    if (options.json) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        return;
    }
    if ("auditScope" in report) {
        process.stdout.write(`${formatProjectWorkflowReport(report)}\n`);
        return;
    }
    if (report.tool === "latchpm") {
        process.stdout.write(`${formatLatchpmReport(report)}\n`);
        return;
    }
    process.stdout.write(`${formatHumanReport(report)}\n`);
}
async function askForCommandApproval(title, command) {
    process.stdout.write(["", title, `  npm command: ${formatNpmCommand(command)}`, ""].join("\n"));
    const response = await prompts({
        type: "select",
        name: "decision",
        message: "Decision",
        choices: [
            { title: "Run", value: "run" },
            { title: "Deny", value: "deny" }
        ],
        initial: 1
    });
    return response.decision === "run";
}
function printCommandBeforeExecution(command) {
    process.stderr.write(`latchpm: running ${formatNpmCommand(command)}\n`);
}
async function askForDecision(report, policyDecision) {
    for (;;) {
        process.stdout.write(formatDecisionSummary(report, policyDecision));
        const response = await prompts({
            type: "select",
            name: "decision",
            message: "Decision",
            choices: [
                { title: "Install normally", value: "normal" },
                { title: "Install with --ignore-scripts", value: "ignore-scripts" },
                { title: "Deny", value: "denied" },
                { title: "View findings", value: "findings" },
                { title: "Print JSON", value: "json" }
            ],
            initial: 2
        });
        if (response.decision === "normal" || response.decision === "ignore-scripts" || response.decision === "denied") {
            return response.decision;
        }
        if (!response.decision) {
            return "denied";
        }
        if (response.decision === "findings") {
            process.stdout.write(formatFindings(report));
        }
        if (response.decision === "json") {
            process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        }
    }
}
function formatDecisionSummary(report, policyDecision) {
    const topFindings = report.risk.findings
        .filter((finding) => finding.severity !== "info")
        .slice(0, 3)
        .map((finding) => `  - [${finding.severity}] ${finding.title}: ${finding.message}`)
        .join("\n");
    return [
        "",
        "Install Summary",
        `  Risk: ${report.risk.score}/100 (${report.risk.level})`,
        `  Recommendation: ${report.decision.recommended}`,
        `  Policy: ${policyDecision.allowed ? "allow" : "deny"} - ${policyDecision.reason}`,
        `  Resolved install spec: ${report.install?.resolvedInstallSpec ?? buildResolvedInstallSpec(report)}`,
        "  Top findings:",
        topFindings || "  - none",
        ""
    ].join("\n");
}
function formatFindings(report) {
    return [
        "",
        "Findings",
        ...report.risk.findings.map((finding) => {
            const location = finding.file ? ` (${finding.file})` : "";
            const evidence = finding.evidence ? ` Evidence: ${finding.evidence}` : "";
            return `  - [${finding.severity}] ${finding.category}/${finding.code}${location}: ${finding.message}${evidence}`;
        }),
        ""
    ].join("\n");
}
function mergeOptions(options) {
    return { ...program.opts(), ...options };
}
function shouldBypassCache(options) {
    return options.noCache === true || options.cache === false || process.argv.includes("--no-cache");
}
function actionOptions(...values) {
    return values.reduce((acc, value) => {
        if (typeof value.opts === "function") {
            return { ...acc, ...value.opts() };
        }
        return { ...acc, ...value };
    }, {});
}
function handleError(error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`latchpm: ${message}\n`);
    if (code === "PACKAGE_NOT_FOUND") {
        process.exit(exitCodes.packageNotFound);
    }
    if (code === "REGISTRY_ERROR") {
        process.exit(exitCodes.registryError);
    }
    if (code === "INTEGRITY_FAILED") {
        process.exit(exitCodes.integrityFailed);
    }
    if (code === "ANALYSIS_FAILED") {
        process.exit(exitCodes.analysisFailed);
    }
    if (code === "POLICY_ERROR") {
        process.exit(exitCodes.deniedByPolicy);
    }
    if (code === "SCRIPT_NOT_FOUND" || code === "PROJECT_PACKAGE_ERROR") {
        process.exit(exitCodes.generalError);
    }
    process.exit(exitCodes.generalError);
}
//# sourceMappingURL=index.js.map