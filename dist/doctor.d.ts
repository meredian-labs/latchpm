export type DoctorCheck = {
    name: string;
    ok: boolean;
    message: string;
};
export type DoctorReport = {
    ready: boolean;
    checks: DoctorCheck[];
};
export type DoctorOptions = {
    cachePath?: string;
    registryUrl?: string;
    cwd?: string;
    fetchImpl?: typeof fetch;
};
export declare function runDoctor(options?: DoctorOptions): Promise<DoctorReport>;
export declare function formatDoctorReport(report: DoctorReport): string;
export declare function checkNodeVersion(version: string): DoctorCheck;
