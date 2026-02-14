import { ApiService } from './api.service';
import { ModuleService } from './module.service';
import { ModulesConfig, ModulesLock } from '../types/modules-config';
/**
 * 模块依赖管理服务
 * 类似 npm 的 package.json + package-lock.json 机制
 */
export declare class ModulesManagerService {
    private api;
    private moduleService;
    private configFileName;
    private lockFileName;
    private gitignoreFileName;
    constructor(api: ApiService, moduleService: ModuleService);
    /**
     * 初始化 modules.json 配置文件
     */
    initConfig(projectDir: string): void;
    /**
     * 读取 modules.json 配置
     */
    readConfig(projectDir: string): ModulesConfig;
    /**
     * 保存配置到 modules.json
     */
    saveConfig(projectDir: string, config: ModulesConfig): void;
    /**
     * 读取 modules-lock.json
     */
    readLock(projectDir: string): ModulesLock | null;
    /**
     * 保存锁定文件
     */
    saveLock(projectDir: string, lock: ModulesLock): void;
    /**
     * 添加模块依赖到 modules.json
     */
    addModule(projectDir: string, moduleName: string, versionRange?: string, options?: {
        save?: boolean;
    }): Promise<void>;
    /**
     * 从 modules.json 移除模块
     */
    removeModule(projectDir: string, moduleName: string): void;
    /**
     * 安装所有模块依赖
     */
    installAll(projectDir: string, options?: {
        forceFresh?: boolean;
    }): Promise<void>;
    /**
     * 解析版本范围，返回具体版本
     */
    private resolveVersion;
    /**
     * 更新 .gitignore，添加模块目录
     */
    updateGitignore(projectDir: string): void;
    /**
     * 清理未使用的模块
     */
    prune(projectDir: string): Promise<void>;
    /**
     * 列出所有模块依赖
     */
    list(projectDir: string): void;
}
//# sourceMappingURL=modules-manager.service.d.ts.map