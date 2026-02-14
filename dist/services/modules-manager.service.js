"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesManagerService = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const modules_config_1 = require("../types/modules-config");
/**
 * 模块依赖管理服务
 * 类似 npm 的 package.json + package-lock.json 机制
 */
class ModulesManagerService {
    constructor(api, moduleService) {
        this.api = api;
        this.moduleService = moduleService;
        this.configFileName = 'modules.json';
        this.lockFileName = 'modules-lock.json';
        this.gitignoreFileName = '.gitignore';
    }
    /**
     * 初始化 modules.json 配置文件
     */
    initConfig(projectDir) {
        const configPath = path.join(projectDir, this.configFileName);
        if (fs.existsSync(configPath)) {
            console.log('⚠️  modules.json 已存在');
            return;
        }
        fs.writeJsonSync(configPath, modules_config_1.DEFAULT_MODULES_CONFIG, { spaces: 2 });
        console.log('✓ 创建 modules.json 配置文件');
        // 更新 .gitignore
        this.updateGitignore(projectDir);
    }
    /**
     * 读取 modules.json 配置
     */
    readConfig(projectDir) {
        const configPath = path.join(projectDir, this.configFileName);
        if (!fs.existsSync(configPath)) {
            return modules_config_1.DEFAULT_MODULES_CONFIG;
        }
        return fs.readJsonSync(configPath);
    }
    /**
     * 保存配置到 modules.json
     */
    saveConfig(projectDir, config) {
        const configPath = path.join(projectDir, this.configFileName);
        fs.writeJsonSync(configPath, config, { spaces: 2 });
    }
    /**
     * 读取 modules-lock.json
     */
    readLock(projectDir) {
        const lockPath = path.join(projectDir, this.lockFileName);
        if (!fs.existsSync(lockPath)) {
            return null;
        }
        return fs.readJsonSync(lockPath);
    }
    /**
     * 保存锁定文件
     */
    saveLock(projectDir, lock) {
        const lockPath = path.join(projectDir, this.lockFileName);
        fs.writeJsonSync(lockPath, lock, { spaces: 2 });
    }
    /**
     * 添加模块依赖到 modules.json
     */
    async addModule(projectDir, moduleName, versionRange, options) {
        const config = this.readConfig(projectDir);
        // 如果没有指定版本，获取最新版本
        let version = versionRange;
        if (!version) {
            console.log(`获取 ${moduleName} 的最新版本...`);
            const response = await this.api.get(`/api/modules/${moduleName}`);
            if (!response.success) {
                throw new Error('获取模块信息失败');
            }
            version = `^${response.module.latest}`;
        }
        // 添加到配置
        if (!config.externalModules) {
            config.externalModules = {};
        }
        config.externalModules[moduleName] = version;
        // 保存配置
        if (options?.save !== false) {
            this.saveConfig(projectDir, config);
            console.log(`✓ 已添加 ${moduleName}@${version} 到 modules.json`);
        }
    }
    /**
     * 从 modules.json 移除模块
     */
    removeModule(projectDir, moduleName) {
        const config = this.readConfig(projectDir);
        if (config.externalModules && config.externalModules[moduleName]) {
            delete config.externalModules[moduleName];
            this.saveConfig(projectDir, config);
            console.log(`✓ 已从 modules.json 移除 ${moduleName}`);
        }
        else {
            console.log(`⚠️  ${moduleName} 不在依赖列表中`);
        }
    }
    /**
     * 安装所有模块依赖
     */
    async installAll(projectDir, options) {
        const config = this.readConfig(projectDir);
        const lock = this.readLock(projectDir);
        if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
            console.log('📦 没有需要安装的外部模块');
            return;
        }
        const installDir = config.options?.installDir || modules_config_1.DEFAULT_MODULES_CONFIG.options.installDir;
        const absoluteInstallDir = path.resolve(projectDir, installDir);
        console.log(`\n📦 开始安装外部模块...`);
        console.log(`📁 安装目录: ${installDir}\n`);
        const newLock = {
            modules: {},
            lockfileVersion: 1,
            generatedAt: new Date().toISOString(),
        };
        let installed = 0;
        let skipped = 0;
        for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
            try {
                // 解析版本范围，获取具体版本
                const targetVersion = await this.resolveVersion(moduleName, versionRange, lock, options?.forceFresh);
                // 检查模块是否已安装
                const moduleDir = path.join(absoluteInstallDir, moduleName);
                const isInstalled = fs.existsSync(moduleDir);
                if (isInstalled && !options?.forceFresh) {
                    console.log(`⏭️  ${moduleName}@${targetVersion} 已安装（跳过）`);
                    skipped++;
                }
                else {
                    console.log(`⬇️  安装 ${moduleName}@${targetVersion}...`);
                    await this.moduleService.install(moduleName, targetVersion, installDir);
                    installed++;
                }
                // 记录到锁定文件
                newLock.modules[moduleName] = {
                    version: targetVersion,
                    resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`,
                };
            }
            catch (error) {
                console.error(`❌ 安装 ${moduleName} 失败:`, error.message);
            }
        }
        // 保存锁定文件
        if (config.options?.lockFile !== false) {
            this.saveLock(projectDir, newLock);
            console.log(`\n✓ 已更新 ${this.lockFileName}`);
        }
        console.log(`\n✅ 安装完成！`);
        console.log(`   新安装: ${installed} 个`);
        console.log(`   已跳过: ${skipped} 个`);
    }
    /**
     * 解析版本范围，返回具体版本
     */
    async resolveVersion(moduleName, versionRange, lock, forceFresh) {
        // 如果有锁定文件且不是强制刷新，优先使用锁定版本
        if (lock && lock.modules[moduleName] && !forceFresh) {
            return lock.modules[moduleName].version;
        }
        // 获取模块信息
        const response = await this.api.get(`/api/modules/${moduleName}`);
        if (!response.success) {
            throw new Error('获取模块信息失败');
        }
        const module = response.module;
        const availableVersions = Object.keys(module.versions);
        // 简单的版本范围解析
        if (versionRange === 'latest' || versionRange === '*') {
            return module.latest;
        }
        // 移除 ^ 或 ~ 前缀
        const cleanVersion = versionRange.replace(/^[\^~]/, '');
        // 如果是精确版本
        if (availableVersions.includes(cleanVersion)) {
            return cleanVersion;
        }
        // 否则返回最新版本
        return module.latest;
    }
    /**
     * 更新 .gitignore，添加模块目录
     */
    updateGitignore(projectDir) {
        const gitignorePath = path.join(projectDir, this.gitignoreFileName);
        const ignoreEntries = [
            'external_modules/',
            'local_modules/'
        ];
        let content = '';
        if (fs.existsSync(gitignorePath)) {
            content = fs.readFileSync(gitignorePath, 'utf-8');
        }
        let modified = false;
        // 添加需要忽略的目录
        for (const entry of ignoreEntries) {
            if (!content.includes(entry)) {
                if (!modified) {
                    if (content && !content.endsWith('\n')) {
                        content += '\n';
                    }
                    content += `\n# External and local modules (managed by modules.json and package.json)\n`;
                    modified = true;
                }
                content += `${entry}\n`;
            }
        }
        if (modified) {
            fs.writeFileSync(gitignorePath, content);
            console.log(`✓ 已更新 .gitignore`);
        }
    }
    /**
     * 清理未使用的模块
     */
    async prune(projectDir) {
        const config = this.readConfig(projectDir);
        const installDir = config.options?.installDir || modules_config_1.DEFAULT_MODULES_CONFIG.options.installDir;
        const absoluteInstallDir = path.resolve(projectDir, installDir);
        if (!fs.existsSync(absoluteInstallDir)) {
            console.log('📦 模块目录不存在');
            return;
        }
        const installedModules = fs.readdirSync(absoluteInstallDir);
        const configuredModules = Object.keys(config.externalModules || {});
        const toRemove = installedModules.filter(m => !configuredModules.includes(m));
        if (toRemove.length === 0) {
            console.log('✓ 没有需要清理的模块');
            return;
        }
        console.log(`\n🗑️  清理 ${toRemove.length} 个未使用的模块:\n`);
        for (const moduleName of toRemove) {
            const modulePath = path.join(absoluteInstallDir, moduleName);
            fs.removeSync(modulePath);
            console.log(`   ✓ 删除 ${moduleName}`);
        }
        console.log('\n✅ 清理完成！');
    }
    /**
     * 列出所有模块依赖
     */
    list(projectDir) {
        const config = this.readConfig(projectDir);
        const lock = this.readLock(projectDir);
        const installDir = config.options?.installDir || modules_config_1.DEFAULT_MODULES_CONFIG.options.installDir;
        const absoluteInstallDir = path.resolve(projectDir, installDir);
        console.log('\n📦 外部模块依赖:\n');
        if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
            console.log('   (无)');
            return;
        }
        for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
            const lockedVersion = lock?.modules[moduleName]?.version;
            const isInstalled = fs.existsSync(path.join(absoluteInstallDir, moduleName));
            const status = isInstalled ? '✓' : '✗';
            const versionInfo = lockedVersion ? `${versionRange} (锁定: ${lockedVersion})` : versionRange;
            console.log(`   ${status} ${moduleName}@${versionInfo}`);
        }
        console.log('');
    }
}
exports.ModulesManagerService = ModulesManagerService;
//# sourceMappingURL=modules-manager.service.js.map