export type CacheStatus = {
    path: string;
    exists: boolean;
    files: number;
    bytes: number;
};
export declare function getDefaultCachePath(): string;
export declare function getCacheStatus(cachePath?: string): Promise<CacheStatus>;
export declare function clearCache(cachePath?: string): Promise<CacheStatus>;
export declare function formatCacheStatus(status: CacheStatus): string;
