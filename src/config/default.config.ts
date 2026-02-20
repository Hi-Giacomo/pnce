/**
 * 默认配置常量
 * 集中管理项目中所有的默认配置值
 */

// 注册中心相关配置
export const DEFAULT_REGISTRY_URL = "http://localhost:3000";
export const DEFAULT_WEBSITE_URL = "http://localhost:5173";
export const CLI_VERSION = "0.0.7";

// OAuth2 认证相关配置
export const OAUTH2_CONFIG = {
  CLIENT_ID: "module-registry-cli",
  REDIRECT_PORT: 8765,
  AUTH_TIMEOUT: 120000, // 2分钟超时
  SCOPE: "read write",
} as const;

// 环境变量名称
export const ENV_KEYS = {
  MODULE_REGISTRY: "MODULE_REGISTRY",
  MODULE_REGISTRY_WEBSITE: "MODULE_REGISTRY_WEBSITE",
  MODULE_AUTH_TOKEN: "MODULE_AUTH_TOKEN",
} as const;

// 配置文件路径
export const CONFIG_FILE_NAME = ".modulerc";
