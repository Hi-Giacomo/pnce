/**
 * Default Config
 * AllDefault Config
 */

//
export const DEFAULT_REGISTRY_URL = 'http://localhost:3000';
export const DEFAULT_WEBSITE_URL = 'http://localhost:5173';
export const CLI_VERSION = '0.0.9';

// OAuth2 Auth
export const OAUTH2_CONFIG = {
  CLIENT_ID: 'module-registry-cli',
  REDIRECT_PORT: 8765,
  AUTH_TIMEOUT: 120000, // 2
  SCOPE: 'read write',
} as const;

// Environment variables
export const ENV_KEYS = {
  MODULE_REGISTRY: 'MODULE_REGISTRY',
  MODULE_REGISTRY_WEBSITE: 'MODULE_REGISTRY_WEBSITE',
  MODULE_AUTH_TOKEN: 'MODULE_AUTH_TOKEN',
} as const;

// file
export const CONFIG_FILE_NAME = '.modulerc';
