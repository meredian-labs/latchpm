import { buildNpmRunCommand } from "./installRunner.js";
import { readPackageScripts } from "./projectDeps.js";
export async function resolveScript(scriptName, args, cwd = process.cwd()) {
    const scripts = await readPackageScripts(cwd);
    const command = scripts[scriptName];
    if (!command) {
        throw Object.assign(new Error(`Script not found in package.json: ${scriptName}`), { code: "SCRIPT_NOT_FOUND" });
    }
    return {
        name: scriptName,
        command,
        npmCommand: buildNpmRunCommand(scriptName, args)
    };
}
//# sourceMappingURL=scriptRunner.js.map