import { Command } from 'commander';
import { ModulesManagerService } from '../services/modules-manager.service';
import { ErrorHandler } from '../utils/errors';

/**
 * 注册模块依赖管理相关命令
 * @param program - Commander程序实例
 * @param modulesManager - 模块管理器实例
 */
export function registerModulesManagerCommands(
  program: Command,
  modulesManager: ModulesManagerService
): void {
  // 初始化 modules.json
  program
    .command('modules-init')
    .description('初始化 modules.json 配置文件')
    .action(() => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.initConfig(projectDir);
        console.log('\n💡 提示: 现在可以使用以下命令管理模块依赖:');
        console.log('   yarn cli modules-add <module>     - 添加模块依赖');
        console.log('   yarn cli modules-install          - 安装所有依赖');
        console.log('   yarn cli modules-list             - 查看依赖列表');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 添加模块依赖
  program
    .command('modules-add <module> [version]')
    .description('添加模块到 modules.json（例如: yarn cli modules-add user ^1.0.0）')
    .option('--no-install', '只添加到配置，不立即安装')
    .action(async (module, version, options) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.addModule(projectDir, module, version);

        if (options.install !== false) {
          console.log('\n⬇️  正在安装模块...');
          await modulesManager.installAll(projectDir);
        } else {
          console.log('\n💡 提示: 运行 "yarn cli modules-install" 来安装模块');
        }
      } catch (error: unknown) {
        console.error('添加失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 移除模块依赖
  program
    .command('modules-remove <module>')
    .description('从 modules.json 移除模块依赖')
    .action((module) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.removeModule(projectDir, module);

        console.log('\n💡 提示: 运行 "yarn cli modules-prune" 来清理已安装的模块');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 安装所有模块依赖
  program
    .command('modules-install')
    .description('根据 modules.json 安装所有模块依赖')
    .option('--force', '强制重新安装所有模块')
    .action(async (options) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.installAll(projectDir, { forceFresh: options.force });
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 列出模块依赖
  program
    .command('modules-list')
    .description('列出所有模块依赖')
    .action(() => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.list(projectDir);
      } catch (error: unknown) {
        console.error('列表失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 清理未使用的模块
  program
    .command('modules-prune')
    .description('清理未在 modules.json 中的已安装模块')
    .action(async () => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.prune(projectDir);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
