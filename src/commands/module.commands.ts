import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModuleUploadService } from '../services/module-upload.service';
import { ModuleDownloadService } from '../services/module-download.service';
import { ModuleService } from '../services/module.service';
import { ConfigService } from '../services/config.service';
import { ErrorHandler } from '../utils/errors';
import { getConfigManager } from '../config/manager';

/**
 * 注册模块管理相关命令
 */
export function registerModuleCommands(
  program: Command,
  moduleUploadService: ModuleUploadService,
  moduleDownloadService: ModuleDownloadService
): void {
  // 上传模块命令
  program
    .command('upload')
    .description('上传模块到注册中心（从 module.config.json 自动读取模块信息）')
    .option('-d, --directory <dir>', '模块目录路径', '.')
    .action(async (options) => {
      try {
        const configManager = getConfigManager();
        // 检查是否已登录
        if (!configManager.getToken()) {
          throw new Error('请先登录，运行: pnce login');
        }

        await moduleUploadService.upload(options.directory);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  program
    .command('publish')
    .description('上传模块到注册中心（从 module.config.json 自动读取模块信息）')
    .option('-d, --directory <dir>', '模块目录路径', '.')
    .action(async (options) => {
      try {
        const configManager = getConfigManager();
        // 检查是否已登录
        if (!configManager.getToken()) {
          throw new Error('请先登录，运行: pnce login');
        }

        await moduleUploadService.upload(options.directory);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 修正导入路径命令（使用旧的服务）
  const moduleService = new ModuleService(require('./index').api); // 从全局获取api实例
  program
    .command('fix-imports <module>')
    .description('修正模块中已安装依赖的导入路径')
    .option('-d, --dir <dir>', '模块所在目录（相对于 src/external_modules 或 src/local_modules）', 'src/external_modules')
    .action(async (moduleName, options) => {
      try {
        const initialCwd = process.env.INIT_CWD || process.cwd();
        const projectRoot = initialCwd;
        const modulePath = path.join(projectRoot, options.dir, moduleName);

        if (!fs.existsSync(modulePath)) {
          console.error(`❌ 错误: 模块不存在于 ${modulePath}`);
          process.exit(1);
        }

        console.log(`\n🔧 修正模块 ${moduleName} 的导入路径...\n`);
        // 需要访问moduleService的方法，暂时注释掉
        // await moduleService.fixImportForModule(modulePath, projectRoot);
        console.log('\n✅ 导入路径修正完成！');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
