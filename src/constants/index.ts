/**
 * 应用常量配置
 * 集中管理硬编码的值和魔法数字
 */

/**
 * Token相关常量
 */
export const TOKEN = {
  /** 默认Token过期时间(秒) */
  DEFAULT_EXPIRE_SECONDS: 3600,
  /** Token过期提前检测时间(毫秒) */
  EXPIRE_BUFFER_MS: 300000, // 5分钟
} as const;

/**
 * HTTP相关常量
 */
export const HTTP = {
  /** 默认超时时间(毫秒) */
  DEFAULT_TIMEOUT: 5000,
  /** 下载超时时间(毫秒) */
  DOWNLOAD_TIMEOUT: 300000,
  /** 上传超时时间(毫秒) */
  UPLOAD_TIMEOUT: 600000,
  /** API重试次数 */
  RETRY_COUNT: 3,
  /** 重试延迟倍数(毫秒) */
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * 下载相关常量
 */
export const DOWNLOAD = {
  /** 临时目录 */
  TEMP_DIR: '.module-temp',
  /** 临时目录完整路径 */
  get TEMP_DIR_PATH(): string {
    return `${require('os').homedir()}/${this.TEMP_DIR}`;
  },
  /** 临时文件扩展名 */
  TEMP_FILE_EXT: '.tgz',
  /** 默认并发下载数 */
  DEFAULT_CONCURRENCY: 3,
  /** 最大并发下载数 */
  MAX_CONCURRENCY: 10,
} as const;

/**
 * 文件路径相关常量
 */
export const PATHS = {
  /** 配置文件名 */
  CONFIG_FILE: 'config.json',
  /** 模块配置文件名 */
  MODULE_CONFIG_FILE: 'module.config.json',
  /** 包配置文件名 */
  PACKAGE_FILE: 'package.json',
  /** 端口缓存文件名 */
  PORT_CACHE_FILE: '.module-port-cache.json',
  /** NPM忽略文件名 */
  NPMIGNORE_FILE: '.npmignore',
  /** 外部模块目录 */
  EXTERNAL_MODULES_DIR: 'src/external_modules',
  /** 本地模块目录 */
  LOCAL_MODULES_DIR: 'src/local_modules',
  /** PNCE配置目录 */
  PNCE_CONFIG_DIR: '.pnce',
} as const;

/**
 * 验证相关常量
 */
export const VALIDATION = {
  /** 最小密码长度 */
  MIN_PASSWORD_LENGTH: 6,
  /** 邮箱正则表达式 */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * 默认NPM忽略内容
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
 * 排除的目录模式
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
