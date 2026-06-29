import { type NpmCommand } from "./installRunner.js";
export type ResolvedScript = {
    name: string;
    command: string;
    npmCommand: NpmCommand;
};
export declare function resolveScript(scriptName: string, args: string[], cwd?: string): Promise<ResolvedScript>;
