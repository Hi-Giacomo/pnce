import { Command } from 'commander';
import { ConfigManager } from '../config/manager';
import { getLogger } from '../utils/logger';
import readline from 'readline';
import chalk from 'chalk';

const logger = getLogger();

/**
 * 交互式配置向导
 */
export const initCommand = new Command('init')
  .description('交互式配置向导 - 设置 PNCE CLI')
  .action(async () => {
    logger.info('启动交互式配置向导');
    console.log(chalk.cyan('\n🚀 PNCE CLI 配置向导\n'));
    console.log(chalk.gray('本向导将帮助您配置 PNCE CLI 的基本设置\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const configManager = new ConfigManager();
    const config: Record<string, string> = {};

    // 创建一个辅助函数来获取用户输入
    const question = (prompt: string): Promise<string> => {
      return new Promise(resolve => {
        rl.question(prompt, answer => {
          resolve(answer.trim());
        });
      });
    };

    try {
      // 服务器地址
      console.log(chalk.yellow('步骤 1/3: 配置服务器'));
      const serverUrl =
        (await question('  输入服务器地址 (直接回车使用默认): ')) ||
        'https://pnce.example.com';
      config.serverUrl = serverUrl;

      // 日志级别
      console.log('\n' + chalk.yellow('步骤 2/3: 配置日志级别'));
      console.log(chalk.gray('  可选: debug, info, warn, error (默认: info)'));
      const logLevel = (await question('  输入日志级别: ')) || 'info';
      config.logLevel = ['debug', 'info', 'warn', 'error'].includes(logLevel)
        ? logLevel
        : 'info';

      // 代理设置
      console.log('\n' + chalk.yellow('步骤 3/3: 配置代理（可选）'));
      const useProxy = await question('  是否使用代理? (y/N): ');
      if (useProxy.toLowerCase() === 'y' || useProxy.toLowerCase() === 'yes') {
        const proxyUrl = await question('  输入代理 URL (如 http://127.0.0.1:7890): ');
        config.proxyUrl = proxyUrl;
      }

      // 保存配置
      console.log('\n' + chalk.cyan('💾 保存配置...'));
      configManager.setUserConfig(config);

      console.log(chalk.green('\n✅ 配置完成！\n'));
      console.log(chalk.gray('配置文件位置: '));
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}`));
      console.log(chalk.gray('\n您可以使用 `pnce config` 查看或修改配置\n'));

      logger.info('配置向导完成', { config });
    } catch (error) {
      logger.error('配置向导失败', { error });
      console.log(chalk.red('\n❌ 配置失败: ' + (error as Error).message));
    } finally {
      rl.close();
    }
  });

export function register(program: Command): void {
  program.addCommand(initCommand);
}
