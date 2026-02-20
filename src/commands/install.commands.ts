import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModuleService } from '../services/module.service';
import { ModulesManagerService } from '../services/modules-manager.service';
import { ApiService } from '../services/api.service';

/**
 * 添加模块到 package.json 的 localModules 字段
 */
async function addToPackageJson(
  apiService: ApiService,
  projectDir: string,
  moduleName: string,
  version?: string
): Promise<void> {
  const packageJsonPath = path.join(projectDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json 不存在');
  }

  const packageJson = fs.readJsonSync(packageJsonPath);

  // 如果没有指定版本，获取最新版本
  let targetVersion = version;
  if (!targetVersion) {
    console.log(`获取 ${moduleName} 的最新版本...`);
    const response = await apiService.get(`/api/modules/${moduleName}`);
    if (!response.success) {
      throw new Error('获取模块信息失败');
    }
    targetVersion = `^${response.module.latest}`;
  }

  // 初始化 localModules 字段
  if (!packageJson.localModules) {
    packageJson.localModules = {};
  }

  // 添加模块
  packageJson.localModules[moduleName] = targetVersion;

  // 保存 package.json
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
  console.log(`✓ 已添加 ${moduleName}@${targetVersion} 到 package.json 的 localModules`);
}

/**
 * 将安装记录添加到 module.config.json
 */
async function addToModuleConfig(
  apiService: ApiService,
  projectDir: string,
  moduleName: string,
  version?: string
): Promise<void> {
  const moduleConfigPath = path.join(projectDir, 'module.config.json');

  if (!fs.existsSync(moduleConfigPath)) {
    // 如果没有 module.config.json，创建一个
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJson = fs.existsSync(packageJsonPath) ? fs.readJsonSync(packageJsonPath) : {};
    
    const moduleConfig = {
      name: packageJson.name || 'unknown',
      description: packageJson.description || '',
      author: packageJson.author || 'module-author',
      version: packageJson.version || '1.0.0',
      type: 'service' as const,
      appId: '',
      teamId: '',
      installedModules: {},
    };
    
    fs.writeJsonSync(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  const moduleConfig = fs.readJsonSync(moduleConfigPath);

  // 初始化 installedModules 字段
  if (!moduleConfig.installedModules) {
    moduleConfig.installedModules = {};
  }

  // 如果没有指定版本，获取最新版本
  let targetVersion = version;
  if (!targetVersion) {
    const response = await apiService.get(`/api/modules/${moduleName}`);
    if (response.success && response.module) {
      targetVersion = response.module.latest;
    }
  }

  // 添加或更新安装记录
  if (targetVersion) {
    moduleConfig.installedModules[moduleName] = targetVersion;
    fs.writeJsonSync(moduleConfigPath, moduleConfig, { spaces: 2 });
    console.log(`✓ 已添加 ${moduleName}@${targetVersion} 到 module.config.json 的 installedModules`);
  }
}

/**
 * 注册安装相关命令
 */
export function registerInstallCommands(
  program: Command,
  moduleService: ModuleService,
  modulesManager: ModulesManagerService,
  api: ApiService
): void {
  // 安装模块命令
  program
    .command('install <module>')
    .description('安装模块（支持 format: module@version）')
    .option('-p, --port <port>', '指定端口（可选）')
    .option('--link', '添加到 modules.json（外部依赖，存储在 src/external_modules/）')
    .option('--save', '添加到 package.json 的 localModules（本地集成，存储在 src/local_modules/）')
    .action(async (module, options) => {
      try {
        const initialCwd = process.env.INIT_CWD || process.cwd();

        // 解析 module@version 格式
        const [moduleName, version] = module.split('@');

        // 检查是否同时指定了 --link 和 --save
        if (options.link && options.save) {
          console.error('❌ 错误: 不能同时使用 --link 和 --save');
          console.error('   --link: 添加到 modules.json (外部依赖)');
          console.error('   --save: 添加到 package.json (本地集成)');
          process.exit(1);
        }

        // 确定安装模式和目录
        let installDir: string;
        let installMode: 'link' | 'save' | 'temp';

        if (options.link) {
          installMode = 'link';
          installDir = 'src/external_modules';
          console.log('✨ 模式: 外部依赖（添加到 modules.json）\n');
        } else if (options.save) {
          installMode = 'save';
          installDir = 'src/local_modules';
          console.log('✨ 模式: 本地集成（添加到 package.json）\n');
        } else {
          // 默认临时安装
          installMode = 'temp';
          installDir = 'src/external_modules';
          console.log('✨ 模式: 临时安装（不加入依赖管理）\n');
          console.log('💡 提示: 使用 --link 添加到 modules.json，或 --save 添加到 package.json\n');
        }

        // 执行安装
        if (installMode === 'link') {
          // 添加到 modules.json 并安装
          await modulesManager.addModule(initialCwd, moduleName, version ? version : undefined);
          await modulesManager.installAll(initialCwd);
        } else if (installMode === 'save') {
          // 添加到 package.json 的 localModules 并安装
          await addToPackageJson(api, initialCwd, moduleName, version);
          await moduleService.install(moduleName, version, installDir);
        } else {
          // 临时安装
          await moduleService.install(moduleName, version, installDir);
        }

        // 将安装记录写入 module.config.json
        await addToModuleConfig(api, initialCwd, moduleName, version);

        // 如果指定了端口，更新模块配置
        if (options.port) {
          const moduleConfigPath = path.join(
            initialCwd,
            installDir,
            moduleName,
            'module.config.json'
          );

          if (fs.existsSync(moduleConfigPath)) {
            const config = fs.readJsonSync(moduleConfigPath);
            config.port = parseInt(options.port);
            fs.writeJsonSync(moduleConfigPath, config, { spaces: 2 });
            console.log(`✓ 模块 ${moduleName} 端口已配置为 ${options.port}`);
          } else {
            console.log(`  提示: 模块 ${moduleName} 没有 module.config.json，无法配置端口`);
          }
        }
      } catch (error: any) {
        console.error('安装失败:', error.message);
        process.exit(1);
      }
    });
}
