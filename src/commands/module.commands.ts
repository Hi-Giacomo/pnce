import { Command } from 'commander';
import { ModuleService } from '../services/module.service';
import { ConfigService } from '../services/config.service';

/**
 * 注册模块管理相关命令
 */
export function registerModuleCommands(program: Command, moduleService: ModuleService): void {
  // 上传模块命令
  program
    .command('upload')
    .description('上传模块到注册中心（从 package.json 自动读取模块信息）')
    .option('-d, --directory <dir>', '模块目录路径', '.')
    .action(async (options) => {
      try {
        const config = ConfigService.getConfig();
        // 检查是否已登录
        if (!config.authToken) {
          console.error('❌ 错误: 请先登录');
          console.error('   运行: yarn cli login');
          process.exit(1);
        }

        await moduleService.upload(options.directory);
      } catch (error: any) {
        console.error('上传失败:', error.message);
        process.exit(1);
      }
    });



  // 查看统计信息命令
  program
    .command('stats')
    .description('查看统计信息')
    .action(async () => {
      try {
        await moduleService.getStats();
      } catch (error: any) {
        console.error('错误:', error.message);
        process.exit(1);
      }
    });
}
