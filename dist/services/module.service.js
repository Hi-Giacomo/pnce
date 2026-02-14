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
exports.ModuleService = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const FormData = require("form-data");
class ModuleService {
    constructor(api) {
        this.api = api;
    }
    async upload(moduleDir) {
        // 获取初始工作目录（npm/yarn 设置的 INIT_CWD 或使用 cwd）
        const initialCwd = process.env.INIT_CWD || process.cwd();
        // 解析为绝对路径（相对于初始工作目录）
        const absoluteModuleDir = path.resolve(initialCwd, moduleDir);
        // 读取 package.json
        const packageJsonPath = path.join(absoluteModuleDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`错误: 未找到 package.json 文件: ${packageJsonPath}`);
        }
        const packageJson = fs.readJsonSync(packageJsonPath);
        // 读取 module.config.json
        const moduleConfigPath = path.join(absoluteModuleDir, 'module.config.json');
        let appId = '';
        let teamId = '';
        let type = '';
        if (fs.existsSync(moduleConfigPath)) {
            const moduleConfig = fs.readJsonSync(moduleConfigPath);
            appId = moduleConfig.appId || '';
            teamId = moduleConfig.teamId || '';
            type = moduleConfig.type || '';
        }
        const moduleName = packageJson.name;
        const moduleVersion = packageJson.version;
        const moduleDescription = packageJson.description || '';
        if (!moduleName || !moduleVersion) {
            throw new Error('错误: package.json 中缺少必需的 name 或 version 字段');
        }
        console.log(`正在打包模块 ${moduleName}@${moduleVersion}...`);
        console.log(`名称: ${moduleName}`);
        console.log(`版本: ${moduleVersion}`);
        console.log(`描述: ${moduleDescription}`);
        if (type) {
            console.log(`类型: ${type}`);
        }
        if (appId) {
            console.log(`应用ID: ${appId}`);
        }
        if (teamId) {
            console.log(`团队ID: ${teamId}`);
        }
        console.log('注意: 作者信息将从您的登录账号自动获取');
        // 创建临时 tgz 文件（使用用户主目录的 .module-temp）
        const tempDir = path.join(require('os').homedir(), '.module-temp');
        fs.ensureDirSync(tempDir);
        const tgzPath = path.join(tempDir, `${moduleName}-${moduleVersion}.tgz`);
        console.log(`模块目录: ${absoluteModuleDir}`);
        console.log(`临时文件: ${tgzPath}`);
        // 确保 .npmignore 存在，排除 external_modules/ 目录
        await this.ensureNpmignore(absoluteModuleDir);
        await this.createPackage(absoluteModuleDir, tgzPath);
        console.log('上传中...');
        // 上传到服务器（不再发送 author 字段）
        const formData = new FormData();
        formData.append('package', fs.createReadStream(tgzPath));
        formData.append('name', moduleName);
        formData.append('version', moduleVersion);
        formData.append('description', moduleDescription);
        if (appId) {
            formData.append('appId', appId); // 添加 appId
        }
        if (teamId) {
            formData.append('teamId', teamId); // 添加 teamId
        }
        if (type) {
            formData.append('type', type); // 添加 type
        }
        const response = await this.api.post('/api/modules/upload', formData, true);
        if (response.success) {
            console.log(`✓ 模块 ${moduleName}@${moduleVersion} 上传成功!`);
            if (response.module?.author) {
                console.log(`  作者: ${response.module.author}`);
            }
        }
        else {
            throw new Error(response.message || '上传失败');
        }
        // 清理临时文件
        fs.removeSync(tempDir);
    }
    async install(moduleName, version, installDir = 'node_modules') {
        // 获取初始工作目录（npm/yarn 设置的 INIT_CWD 或使用 cwd）
        const initialCwd = process.env.INIT_CWD || process.cwd();
        let targetVersion = version;
        let installPath = path.resolve(initialCwd, installDir, moduleName);
        console.log(`[DEBUG] initialCwd: ${initialCwd}`);
        console.log(`[DEBUG] installDir: ${installDir}`);
        console.log(`[DEBUG] installPath: ${installPath}`);
        // 如果没有指定版本，获取最新版本
        if (!targetVersion) {
            console.log(`获取 ${moduleName} 的最新版本...`);
            const response = await this.api.get(`/api/modules/${moduleName}`);
            if (!response.success) {
                throw new Error(response.message || '获取模块信息失败');
            }
            targetVersion = response.module.latest;
        }
        console.log(`下载 ${moduleName}@${targetVersion}...`);
        const downloadUrl = `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`;
        const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            headers: this.api['getAuthHeaders']?.() || {},
        });
        const tempDir = path.join(require('os').homedir(), '.module-temp');
        fs.ensureDirSync(tempDir);
        const tgzPath = path.join(tempDir, `${moduleName}-${targetVersion}.tgz`);
        const writer = fs.createWriteStream(tgzPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', reject);
        });
        console.log('解压中...');
        await this.extractTgz(tgzPath, installPath);
        fs.unlinkSync(tgzPath);
        console.log(`✓ 模块 ${moduleName}@${targetVersion} 安装成功!`);
        // 解析并安装依赖
        await this.installDependencies(moduleName, installPath, initialCwd);
    }
    async list() {
        const response = await this.api.get('/api/modules');
        if (!response.success) {
            throw new Error(response.message || '获取模块列表失败');
        }
        const modules = response.modules;
        if (modules.length === 0) {
            console.log('暂无模块');
            return;
        }
        console.log('\n模块列表:');
        console.log('─'.repeat(80));
        modules.forEach((mod) => {
            const typeLabel = mod.type ? ` [${mod.type}]` : '';
            console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
            console.log(`  描述: ${mod.description || '无'}`);
            console.log(`  作者: ${mod.author}${mod.uploadedBy ? ` (${mod.uploadedBy})` : ''}`);
            console.log(`  版本数: ${Object.keys(mod.versions).length}`);
            console.log('─'.repeat(80));
        });
    }
    async search(query) {
        const response = await this.api.get(`/api/modules?q=${encodeURIComponent(query)}`);
        if (!response.success) {
            throw new Error(response.message || '搜索失败');
        }
        const modules = response.modules;
        if (modules.length === 0) {
            console.log('未找到匹配的模块');
            return;
        }
        console.log(`\n搜索 "${query}" 的结果:`);
        console.log('─'.repeat(80));
        modules.forEach((mod) => {
            const typeLabel = mod.type ? ` [${mod.type}]` : '';
            console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
            console.log(`  描述: ${mod.description || '无'}`);
            console.log(`  作者: ${mod.author}`);
            console.log('─'.repeat(80));
        });
    }
    async info(moduleName) {
        const response = await this.api.get(`/api/modules/${moduleName}`);
        if (!response.success) {
            throw new Error(response.message || '获取模块信息失败');
        }
        const module = response.module;
        console.log(`\n模块信息:`);
        console.log('─'.repeat(40));
        console.log(`名称: ${module.name}`);
        console.log(`描述: ${module.description || '无'}`);
        console.log(`类型: ${module.type || '未分类'}`);
        console.log(`作者: ${module.author}${module.uploadedBy ? ` (${module.uploadedBy})` : ''}`);
        console.log(`创建时间: ${module.createdAt}`);
        console.log(`最新版本: ${module.latest}`);
        if (module.appId) {
            console.log(`应用ID: ${module.appId}`);
        }
        if (module.teamId) {
            console.log(`团队ID: ${module.teamId}`);
        }
        console.log(`\n所有版本:`);
        Object.keys(module.versions).forEach((version) => {
            const v = module.versions[version];
            console.log(`  ${version} - ${this.formatSize(v.size)} (${v.uploadedAt})`);
        });
    }
    async getStats() {
        const response = await this.api.get('/api/stats');
        if (!response.success) {
            throw new Error(response.message || '获取统计信息失败');
        }
        const stats = response.stats;
        console.log('\n注册中心统计:');
        console.log('─'.repeat(40));
        console.log(`模块总数: ${stats.totalModules}`);
        console.log(`版本总数: ${stats.totalVersions}`);
        console.log(`总大小: ${this.formatSize(stats.totalSize)}`);
        if (stats.topAuthors && stats.topAuthors.length > 0) {
            console.log('\n最活跃作者:');
            stats.topAuthors.forEach((item) => {
                console.log(`  ${item.author}: ${item.count} 个模块`);
            });
        }
    }
    createPackage(moduleDir, outputPath) {
        return new Promise((resolve, reject) => {
            // 使用 npm pack 生成 .tgz 包
            child_process.exec('npm pack', { cwd: moduleDir }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`打包失败: ${stderr}`));
                    return;
                }
                // npm pack 的输出是生成的文件名
                const generatedFileName = stdout.trim();
                if (!generatedFileName) {
                    reject(new Error('npm pack 未返回文件名'));
                    return;
                }
                const tgzPath = path.join(moduleDir, generatedFileName);
                // 检查文件是否存在
                if (!fs.existsSync(tgzPath)) {
                    reject(new Error(`打包文件不存在: ${tgzPath}`));
                    return;
                }
                // 将 .tgz 文件移动到目标位置
                fs.moveSync(tgzPath, outputPath, { overwrite: true });
                resolve();
            });
        });
    }
    extractTgz(tgzPath, extractDir) {
        const tar = require('tar');
        // tarball 格式需要先解压到 package 目录
        return new Promise((resolve, reject) => {
            fs.ensureDirSync(extractDir);
            tar.x({
                file: tgzPath,
                cwd: extractDir,
                strip: 1, // 移除 package 目录层级
            }).then(() => {
                // 删除可能存在的 tarball 文件（npm pack 生成的残留）
                const tarballFiles = fs.readdirSync(extractDir).filter(f => f.endsWith('.tgz'));
                tarballFiles.forEach(f => fs.removeSync(path.join(extractDir, f)));
                resolve();
            }).catch(reject);
        });
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    /**
     * 确保 .npmignore 文件存在，排除不需要打包的目录
     * @param moduleDir 模块目录
     */
    async ensureNpmignore(moduleDir) {
        const npmignorePath = path.join(moduleDir, '.npmignore');
        if (!fs.existsSync(npmignorePath)) {
            const defaultIgnore = [
                '# External modules (不打包，通过 modules.json 运行时安装）',
                'external_modules',
                '',
                '# Node modules',
                'node_modules/',
                '',
                '# Build outputs',
                'dist/',
                'build/',
                '',
                '# Git files',
                '.git/',
                '.gitignore',
                '',
                '# Logs',
                '*.log',
                'npm-debug.log*',
                'yarn-debug.log*',
                'yarn-error.log*',
                '',
                '# System files',
                '.DS_Store',
                'Thumbs.db',
                '',
                '# Test coverage',
                'coverage/',
                '',
                '# IDE files',
                '.vscode/',
                '.idea/',
                '*.swp',
                '*.swo',
                '*~',
            ];
            fs.writeFileSync(npmignorePath, defaultIgnore.join('\n'));
            console.log('  ✓ 创建 .npmignore 文件（排除 external_modules，保留 local_modules）');
        }
        else {
            // 检查并更新 .npmignore 规则
            const npmignoreContent = fs.readFileSync(npmignorePath, 'utf-8');
            const lines = npmignoreContent.split('\n');
            let updated = false;
            // 确保包含 external_modules 排除规则
            if (!lines.some(line => line.trim() === 'external_modules' || line.trim() === '/external_modules')) {
                lines.unshift('# External modules (不打包，通过 modules.json 运行时安装）', 'external_modules', '');
                updated = true;
            }
            // 确保不包含 local_modules 的排除规则（local_modules 应该保留在包中）
            const updatedLines = lines.filter(line => {
                const trimmed = line.trim();
                return !(trimmed === 'local_modules' ||
                    trimmed === '/local_modules' ||
                    trimmed === 'local_modules/' ||
                    trimmed === '/local_modules/');
            });
            if (updated || updatedLines.length !== lines.length) {
                fs.writeFileSync(npmignorePath, updatedLines.join('\n'));
                console.log('  ✓ 更新 .npmignore 文件（排除 external_modules，保留 local_modules）');
            }
        }
    }
    /**
     * 解析并安装模块依赖
     * @param moduleName 模块名称
     * @param modulePath 模块路径
     * @param projectRoot 项目根目录
     */
    async installDependencies(moduleName, modulePath, projectRoot) {
        // 读取模块的 package.json
        const packageJsonPath = path.join(modulePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`  [依赖] 模块 ${moduleName} 没有 package.json，跳过依赖安装`);
            return;
        }
        const packageJson = fs.readJsonSync(packageJsonPath);
        const dependencies = packageJson.dependencies || {};
        const localModules = packageJson.localModules || {};
        if (Object.keys(dependencies).length === 0) {
            console.log(`  [依赖] 模块 ${moduleName} 无 package.json 依赖`);
        }
        console.log(`\n  [依赖] 开始解析模块 ${moduleName} 的依赖...`);
        // 分类依赖
        const moduleDependencies = [];
        const npmDependencies = [];
        for (const [depName, depVersion] of Object.entries(dependencies)) {
            if (depName === '@module-registry/custom-service-core') {
                // 框架核心 - 跳过（项目已有）
                console.log(`    - 跳过框架核心: ${depName} (项目已包含)`);
            }
            else if (depName.startsWith('@module-registry/')) {
                // 模块依赖 - 递归安装
                moduleDependencies.push({ name: depName, version: depVersion });
                console.log(`    - package.json 依赖: ${depName}${depVersion ? '@' + depVersion : ''}`);
            }
            else {
                // 第三方 npm 包 - 使用 npm/yarn 安装
                npmDependencies.push({ name: depName, version: depVersion });
                console.log(`    - npm 依赖: ${depName}${depVersion ? '@' + depVersion : ''}`);
            }
        }
        // 安装模块依赖（递归）
        if (moduleDependencies.length > 0) {
            console.log(`\n  [依赖] 安装 package.json 模块依赖...`);
            for (const dep of moduleDependencies) {
                try {
                    // 检查依赖是否已安装
                    const depInstallPath = path.join(projectRoot, 'src/node_modules_external/@module-registry', dep.name.replace('@module-registry/', ''));
                    if (!fs.existsSync(depInstallPath)) {
                        console.log(`    安装模块依赖: ${dep.name}...`);
                        await this.install(dep.name, dep.version === '*' ? undefined : dep.version, 'src/node_modules_external/@module-registry');
                    }
                    else {
                        console.log(`    模块依赖 ${dep.name} 已安装，跳过`);
                    }
                }
                catch (error) {
                    console.error(`    安装模块依赖 ${dep.name} 失败:`, error.message);
                    throw new Error(`安装模块依赖 ${dep.name} 失败: ${error.message}`);
                }
            }
        }
        // 检查并安装 package.json 中的本地模块依赖（local_modules）
        if (localModules && Object.keys(localModules).length > 0) {
            console.log(`\n  [package.json] 发现模块 ${moduleName} 的本地微服务依赖 (local_modules)...`);
            // 计算依赖的安装目录：应该在当前模块的 src/local_modules/ 下
            // 与 external_modules 保持一致，都安装在 src 目录中
            const localModulesPath = path.join(modulePath, 'src', 'local_modules');
            for (const [depName, depVersion] of Object.entries(localModules)) {
                const version = String(depVersion);
                console.log(`    - local_modules 依赖: ${depName}@${version}`);
                // 依赖应该安装在模块的 src/local_modules/ 下
                const depInstallPath = path.join(localModulesPath, depName);
                console.log(`[DEBUG] checking if ${depInstallPath} exists: ${fs.existsSync(depInstallPath)}`);
                if (!fs.existsSync(depInstallPath)) {
                    console.log(`    安装 local_modules 依赖: ${depName} 到 ${localModulesPath}...`);
                    // 递归安装（会自动检查该模块的 modules.json，包括其 local_modules 和 external_modules）
                    const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');
                    // 解析版本范围
                    let targetVersion = version;
                    if (version.startsWith('^') || version.startsWith('~')) {
                        // 获取模块信息解析版本
                        const response = await this.api.get(`/api/modules/${depName}`);
                        if (response.success && response.module) {
                            const availableVersions = Object.keys(response.module.versions);
                            // 简单的版本范围解析：取最新版本
                            targetVersion = response.module.latest;
                        }
                    }
                    // 安装到模块的 src/local_modules/ 目录
                    // 需要计算相对于 projectRoot 的路径
                    const installDir = path.relative(projectRoot, relativeInstallDir);
                    await this.install(depName, targetVersion, installDir);
                }
                else {
                    console.log(`    local_modules 依赖 ${depName} 已安装，检查依赖...`);
                    // 即使模块已安装，也要检查其依赖
                    await this.installDependencies(depName, depInstallPath, projectRoot);
                }
            }
        }
        // 检查并安装 modules.json 中的本地模块依赖（local_modules）
        const modulesJsonPath = path.join(modulePath, 'modules.json');
        console.log(`[DEBUG] modulesJsonPath: ${modulesJsonPath}, exists: ${fs.existsSync(modulesJsonPath)}`);
        if (fs.existsSync(modulesJsonPath)) {
            try {
                const modulesConfig = fs.readJsonSync(modulesJsonPath);
                console.log(`[DEBUG] modulesConfig: ${JSON.stringify(modulesConfig)}`);
                if (modulesConfig.localModules && Object.keys(modulesConfig.localModules).length > 0) {
                    console.log(`\n  [modules.json] 发现模块 ${moduleName} 的本地微服务依赖 (local_modules)...`);
                    // 计算依赖的安装目录：应该在当前模块的 src/local_modules/ 下
                    // 与 external_modules 保持一致，都安装在 src 目录中
                    const localModulesPath = path.join(modulePath, 'src', 'local_modules');
                    for (const [depName, depVersion] of Object.entries(modulesConfig.localModules)) {
                        const version = String(depVersion);
                        console.log(`    - local_modules 依赖: ${depName}@${version}`);
                        // 依赖应该安装在模块的 src/local_modules/ 下
                        const depInstallPath = path.join(localModulesPath, depName);
                        if (!fs.existsSync(depInstallPath)) {
                            console.log(`    安装 local_modules 依赖: ${depName} 到 ${localModulesPath}...`);
                            // 递归安装（会自动检查该模块的 modules.json，包括其 local_modules 和 external_modules）
                            const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');
                            // 解析版本范围
                            let targetVersion = version;
                            if (version.startsWith('^') || version.startsWith('~')) {
                                // 获取模块信息解析版本
                                const response = await this.api.get(`/api/modules/${depName}`);
                                if (response.success && response.module) {
                                    const availableVersions = Object.keys(response.module.versions);
                                    // 简单的版本范围解析：取最新版本
                                    targetVersion = response.module.latest;
                                }
                            }
                            // 安装到模块的 src/local_modules/ 目录
                            // 需要计算相对于 projectRoot 的路径
                            const installDir = path.relative(projectRoot, relativeInstallDir);
                            await this.install(depName, targetVersion, installDir);
                        }
                        else {
                            console.log(`    local_modules 依赖 ${depName} 已安装，检查依赖...`);
                            // 即使模块已安装，也要检查其依赖（包括 externalModules 和 localModules）
                            await this.installDependencies(depName, depInstallPath, projectRoot);
                        }
                    }
                }
                // 检查并安装 modules.json 中的外部模块依赖（多级微服务支持）
                if (modulesConfig.externalModules && Object.keys(modulesConfig.externalModules).length > 0) {
                    console.log(`\n  [modules.json] 发现模块 ${moduleName} 的外部微服务依赖 (external_modules)...`);
                    // 计算依赖的安装目录：应该在当前模块的 src/external_modules/ 下
                    // 如果 modulePath 是 projectRoot/src/external_modules/user
                    // 那么依赖应该安装到 projectRoot/src/external_modules/user/src/external_modules/
                    const parentExternalModulesPath = path.join(modulePath, 'src', 'external_modules');
                    for (const [depName, depVersion] of Object.entries(modulesConfig.externalModules)) {
                        const version = String(depVersion);
                        console.log(`    - external_modules 依赖: ${depName}@${version}`);
                        // 依赖应该安装在父模块的 src/external_modules/ 下
                        const depInstallPath = path.join(parentExternalModulesPath, depName);
                        if (!fs.existsSync(depInstallPath)) {
                            console.log(`    安装 external_modules 依赖: ${depName} 到 ${parentExternalModulesPath}...`);
                            // 递归安装（会自动检查该模块的 modules.json）
                            // 使用相对路径：src/external_modules -> 相对于父模块目录
                            const relativeInstallDir = path.join(modulePath, 'src', 'external_modules');
                            // 解析版本范围
                            let targetVersion = version;
                            if (version.startsWith('^') || version.startsWith('~')) {
                                // 获取模块信息解析版本
                                const response = await this.api.get(`/api/modules/${depName}`);
                                if (response.success && response.module) {
                                    const availableVersions = Object.keys(response.module.versions);
                                    // 简单的版本范围解析：取最新版本
                                    targetVersion = response.module.latest;
                                }
                            }
                            // 安装到父模块的 src/external_modules/ 目录
                            // 需要计算相对于 projectRoot 的路径
                            const installDir = path.relative(projectRoot, relativeInstallDir);
                            await this.install(depName, targetVersion, installDir);
                        }
                        else {
                            console.log(`    external_modules 依赖 ${depName} 已安装，检查依赖...`);
                            // 即使外部模块已安装，也要递归检查其依赖（包括 externalModules 和 localModules）
                            await this.installDependencies(depName, depInstallPath, projectRoot);
                        }
                    }
                }
            }
            catch (error) {
                console.error(`  [modules.json] 解析 ${moduleName} 的 modules.json 失败:`, error.message);
                // 不抛出错误，继续执行
            }
        }
        // 安装 npm 依赖
        if (npmDependencies.length > 0) {
            console.log(`\n  [依赖] 安装 npm 依赖...`);
            await this.installNpmDependencies(npmDependencies, projectRoot);
        }
        console.log(`\n  [依赖] 模块 ${moduleName} 的依赖安装完成`);
    }
    /**
     * 安装 npm 依赖
     * @param dependencies npm 依赖列表
     * @param projectRoot 项目根目录
     */
    async installNpmDependencies(dependencies, projectRoot) {
        // 检查项目使用 npm 还是 yarn
        const useYarn = fs.existsSync(path.join(projectRoot, 'yarn.lock'));
        const packageManager = useYarn ? 'yarn' : 'npm';
        // 构建 install 命令
        const depsToInstall = dependencies
            .map((dep) => `${dep.name}@${dep.version}`)
            .join(' ');
        console.log(`    使用 ${packageManager} 安装: ${depsToInstall}`);
        return new Promise((resolve, reject) => {
            const command = useYarn ? `yarn add ${depsToInstall}` : `npm install ${depsToInstall}`;
            child_process.exec(command, { cwd: projectRoot }, (error, _stdout, stderr) => {
                if (error) {
                    console.error(`    ${packageManager} 安装失败:`, stderr);
                    reject(new Error(`npm 依赖安装失败: ${stderr}`));
                    return;
                }
                console.log(`    ${packageManager} 依赖安装成功`);
                resolve();
            });
        });
    }
}
exports.ModuleService = ModuleService;
//# sourceMappingURL=module.service.js.map