import { spawn } from "node:child_process";
export function buildResolvedInstallSpec(report) {
    return `${report.package.name}@${report.package.resolvedVersion}`;
}
export function buildNpmInstallCommand(packageSpec, installMode) {
    if (installMode === "normal") {
        return { command: "npm", args: ["install", packageSpec] };
    }
    if (installMode === "ignore-scripts") {
        return { command: "npm", args: ["install", packageSpec, "--ignore-scripts"] };
    }
    throw new Error(`Install mode ${installMode} does not run npm install.`);
}
export function buildNpmProjectInstallCommand() {
    return { command: "npm", args: ["install"] };
}
export function buildNpmCiCommand() {
    return { command: "npm", args: ["ci"] };
}
export function buildNpmRemoveCommand(packageName) {
    return { command: "npm", args: ["uninstall", packageName] };
}
export function buildNpmRunCommand(scriptName, args) {
    return { command: "npm", args: ["run", scriptName, "--", ...args] };
}
export function buildNpmPassthroughCommand(args) {
    return { command: "npm", args };
}
export function formatNpmPassthroughWarning() {
    return "No Latch audit is applied to explicit npm passthrough commands.";
}
export function formatNpmCommand(command) {
    return [command.command, ...command.args.map(formatArg)].join(" ");
}
export async function runNpmInstall(packageSpec, installMode) {
    return runNpmCommand(buildNpmInstallCommand(packageSpec, installMode));
}
export async function runNpmCommand(command) {
    return new Promise((resolve, reject) => {
        const child = spawn(command.command, command.args, {
            stdio: "inherit"
        });
        child.on("error", reject);
        child.on("close", (code) => resolve(code ?? 1));
    });
}
function formatArg(arg) {
    if (/^[A-Za-z0-9._/@:=+-]+$/.test(arg)) {
        return arg;
    }
    return JSON.stringify(arg);
}
//# sourceMappingURL=installRunner.js.map