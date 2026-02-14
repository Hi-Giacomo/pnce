export interface ModulesConfig {
    externalModules?: Record<string, string>;
    options?: {
        installDir?: string;
        gitIgnore?: boolean;
        lockFile?: boolean;
    };
}
export interface ModulesLock {
    modules: Record<string, {
        version: string;
        resolved: string;
        integrity?: string;
        dependencies?: Record<string, string>;
    }>;
    lockfileVersion: number;
    generatedAt: string;
}
export declare const DEFAULT_MODULES_CONFIG: ModulesConfig;
//# sourceMappingURL=modules-config.d.ts.map