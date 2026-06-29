import { buildNpmRunCommand, type NpmCommand } from "./installRunner.js";
import { readPackageScripts } from "./projectDeps.js";

export type ResolvedScript = {
  name: string;
  command: string;
  npmCommand: NpmCommand;
};

export async function resolveScript(scriptName: string, args: string[], cwd = process.cwd()): Promise<ResolvedScript> {
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
