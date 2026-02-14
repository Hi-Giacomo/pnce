"use strict";
/**
 * 默认配置常量
 * 集中管理项目中所有的默认配置值
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG_FILE_NAME = exports.ENV_KEYS = exports.OAUTH2_CONFIG = exports.DEFAULT_WEBSITE_URL = exports.DEFAULT_REGISTRY_URL = void 0;
// 注册中心相关配置
exports.DEFAULT_REGISTRY_URL = 'http://localhost:3000';
exports.DEFAULT_WEBSITE_URL = 'http://localhost:5173';
// OAuth2 认证相关配置
exports.OAUTH2_CONFIG = {
    CLIENT_ID: 'module-registry-cli',
    REDIRECT_PORT: 8765,
    AUTH_TIMEOUT: 120000, // 2分钟超时
    SCOPE: 'read write'
};
// 环境变量名称
exports.ENV_KEYS = {
    MODULE_REGISTRY: 'MODULE_REGISTRY',
    MODULE_REGISTRY_WEBSITE: 'MODULE_REGISTRY_WEBSITE',
    MODULE_AUTH_TOKEN: 'MODULE_AUTH_TOKEN'
};
// 配置文件路径
exports.CONFIG_FILE_NAME = '.modulerc';
//# sourceMappingURL=default.config.js.map