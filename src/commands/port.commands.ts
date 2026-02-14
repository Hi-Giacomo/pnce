import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * 注册端口管理相关命令
 */
export function registerPortCommands(program: Command): void {
  // 端口管理命令
  program
    .command('ports')
    .description('端口管理（查看、清除端口缓存）')
    .option('-c, --clear', '清除端口缓存')
    .option('-s, --show', '显示端口分配信息')
    .action(async (options) => {
      try {
        const portCachePath = path.join(process.env.INIT_CWD || process.cwd(), '.module-port-cache.json');

        // 清除端口缓存
        if (options.clear) {
          if (fs.existsSync(portCachePath)) {
            fs.removeSync(portCachePath);
            console.log('✓ 端口缓存已清除');
          } else {
            console.log('端口缓存文件不存在');
          }
          return;
        }

        // 显示端口分配信息（默认行为）
        if (fs.existsSync(portCachePath)) {
          const portCache = fs.readJsonSync(portCachePath);
          console.log('\n📊 端口分配信息：');
          console.log('─'.repeat(40));

          Object.entries(portCache).forEach(([name, port]: [string, any]) => {
            console.log(`  ${name.padEnd(20)} -> ${port}`);
          });

          console.log('─'.repeat(40));
          console.log(`  缓存文件: ${portCachePath}\n`);
        } else {
          console.log('端口缓存文件不存在');
          console.log('提示: 运行 npm run dev 后会自动创建缓存文件');
        }
      } catch (error: any) {
        console.error('错误:', error.message);
        process.exit(1);
      }
    });
}
