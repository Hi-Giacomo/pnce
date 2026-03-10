/**
 * 
 * 
 */

/**
 * Token
 */
export const TOKEN = {
  /** DefaultToken Expiration Time() */
  DEFAULT_EXPIRE_SECONDS: 3600,
  /** Token() */
  EXPIRE_BUFFER_MS: 300000, // 5
} as const;

/**
 * HTTP
 */
export const HTTP = {
  /** Default() */
  DEFAULT_TIMEOUT: 5000,
  /** () */
  DOWNLOAD_TIMEOUT: 300000,
  /** () */
  UPLOAD_TIMEOUT: 600000,
  /** API */
  RETRY_COUNT: 3,
  /** () */
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * 
 */
export const DOWNLOAD = {
  /** Directory */
  TEMP_DIR: '.module-temp',
  /** Directory */
  get TEMP_DIR_PATH(): string {
    return `${require('os').homedir()}/${this.TEMP_DIR}`;
  },
  /** File */
  TEMP_FILE_EXT: '.tgz',
  /** Default */
  DEFAULT_CONCURRENCY: 3,
  /**  */
  MAX_CONCURRENCY: 10,
} as const;

/**
 * File
 */
export const PATHS = {
  /** File */
  CONFIG_FILE: 'config.json',
  /** moduleFile */
  MODULE_CONFIG_FILE: 'module.config.json',
  /** File */
  PACKAGE_FILE: 'package.json',
  /** PortCacheFile */
  PORT_CACHE_FILE: '.module-port-cache.json',
  /** NPMFile */
  NPMIGNORE_FILE: '.npmignore',
  /** module directory */
  EXTERNAL_MODULES_DIR: 'src/external_modules',
  /** Localmodule directory */
  LOCAL_MODULES_DIR: 'src/local_modules',
  /** PNCEDirectory */
  PNCE_CONFIG_DIR: '.pnce',
} as const;

/**
 * Validation
 */
export const VALIDATION = {
  /** password */
  MIN_PASSWORD_LENGTH: 6,
  /** email */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * DefaultNPM
 */
export const DEFAULT_NPMIGNORE = `node_modules/
.git/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
coverage/
dist/
.pnce/
external_modules/
*.log
`;

/**
 * Directory
 */
export const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'npm-debug.log',
  '.DS_Store',
  'coverage',
  '.coverage',
  'dist',
  '.pnce',
] as const;
