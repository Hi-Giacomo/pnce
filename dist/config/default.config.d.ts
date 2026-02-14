/**
 * 默认配置常量
 * 集中管理项目中所有的默认配置值
 */
export declare const DEFAULT_REGISTRY_URL = "http://localhost:3000";
export declare const DEFAULT_WEBSITE_URL = "http://localhost:5173";
export declare const OAUTH2_CONFIG: {
    readonly CLIENT_ID: "module-registry-cli";
    readonly REDIRECT_PORT: 8765;
    readonly AUTH_TIMEOUT: 120000;
    readonly SCOPE: "read write";
};
export declare const ENV_KEYS: {
    readonly MODULE_REGISTRY: "MODULE_REGISTRY";
    readonly MODULE_REGISTRY_WEBSITE: "MODULE_REGISTRY_WEBSITE";
    readonly MODULE_AUTH_TOKEN: "MODULE_AUTH_TOKEN";
};
export declare const CONFIG_FILE_NAME = ".modulerc";
//# sourceMappingURL=default.config.d.ts.map