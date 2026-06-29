export type DependencyCategory = "dependencies" | "devDependencies" | "optionalDependencies" | "peerDependencies";
export type DirectDependency = {
    name: string;
    requestedRange: string;
    requestedSpec: string;
    category: DependencyCategory;
    lockfileVersion?: string;
};
type PackageJson = {
    scripts?: Record<string, string>;
} & Partial<Record<DependencyCategory, Record<string, string>>>;
export declare function readPackageJson(cwd?: string): Promise<PackageJson>;
export declare function readDirectDependencies(cwd?: string, options?: {
    preferLockfile?: boolean;
}): Promise<DirectDependency[]>;
export declare function readPackageScripts(cwd?: string): Promise<Record<string, string>>;
export {};
