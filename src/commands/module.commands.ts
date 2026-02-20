import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModuleService } from '../services/module.service';
import { ConfigService } from '../services/config.service';

/**
 * 注册模块管理相关命令
 */
export function registerModuleCommands(program: Command, moduleService: ModuleService): void {
  // 上传模块命令
  program
    .command('upload')
    .command('publish')
    .description('上传模块到注册中心（从 module.config.json 自动读取模块信息）')
    .option('-d, --directory <dir>', '模块目录路径', '.')
    .action(async (options) => {
      try {
        const config = ConfigService.getConfig();
        // 检查是否已登录
        if (!config.authToken) {
          console.error('❌ 错误: 请先登录');
          console.error('   运行: pnce login');
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

  // 修正导入路径命令
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
        await moduleService.fixImportForModule(modulePath, projectRoot);
        console.log('\n✅ 导入路径修正完成！');
      } catch (error: any) {
        console.error('修正失败:', error.message);
        process.exit(1);
      }
    });
}
