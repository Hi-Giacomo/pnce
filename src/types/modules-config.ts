// 模块依赖配置类型定义

export interface ModulesConfig {
  // 外部模块依赖
  externalModules?: Record<string, string>; // { "module-name": "^1.0.0" }
  
  // 模块安装选项
  options?: {
    // 安装目录
    installDir?: string;
    // 是否在 git 中忽略模块目录
    gitIgnore?: boolean;
    // 是否保存锁定文件
    lockFile?: boolean;
  };
}

export interface ModulesLock {
  // 锁定的模块版本
  modules: Record<string, {
    version: string;
    resolved: string; // 下载 URL
    integrity?: string; // 可选的完整性校验
    dependencies?: Record<string, string>; // 模块的依赖
  }>;
  
  // 锁定文件版本
  lockfileVersion: number;
  
  // 生成时间
  generatedAt: string;
}

export const DEFAULT_MODULES_CONFIG: ModulesConfig = {
  externalModules: {},
  options: {
    installDir: 'src/external_modules',
    gitIgnore: true,
    lockFile: true,
  },
};
