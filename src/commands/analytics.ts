import { Command } from 'commander';
import chalk from 'chalk';
import { getAnalyticsManager } from '../utils/analytics';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * 统计命令
 */
export const analyticsCommand = new Command('analytics')
  .description('管理使用统计（可选）')
  .action(() => {
    const analytics = getAnalyticsManager();
    const stats = analytics.getStats();

    console.log(chalk.cyan('\n📊 使用统计 / Usage Analytics\n'));

    console.log(chalk.gray('状态 / Status:'));
    console.log(
      `  ${stats.enabled ? chalk.green('✓ 已启用 / Enabled') : chalk.gray('○ 已禁用 / Disabled')}`
    );

    if (stats.enabled) {
      console.log(chalk.gray('\n统计信息 / Statistics:'));
      console.log(`  本地事件数 / Local events: ${stats.eventCount}`);
      if (stats.endpoint) {
        console.log(`  统计端点 / Endpoint: ${stats.endpoint}`);
      }
    }

    console.log(chalk.gray('\n使用方法 / Usage:'));
    console.log('  pnce analytics enable  [endpoint]  - 启用统计 / Enable analytics');
    console.log('  pnce analytics disable              - 禁用统计 / Disable analytics');
    console.log('  pnce analytics clear                 - 清空本地统计 / Clear local events');
    console.log('  pnce analytics status                - 查看状态 / Show status');
  });

/**
 * 启用统计子命令
 */
export const enableAnalyticsCommand = new Command('enable')
  .argument('[endpoint]', '统计端点（可选）')
  .description('启用使用统计')
  .action((endpoint?: string) => {
    try {
      const analytics = getAnalyticsManager();
      analytics.enable(endpoint);

      console.log(chalk.green('✓ 使用统计已启用\n'));
      if (endpoint) {
        console.log(chalk.gray(`统计端点: ${endpoint}\n`));
      }
      console.log(chalk.gray('感谢您帮助改进 PNCE CLI！\n'));
      logger.info('使用统计已启用', { endpoint });
    } catch (error) {
      console.log(chalk.red(`启用统计失败: ${error}\n`));
      logger.error('启用统计失败', { error });
    }
  });

/**
 * 禁用统计子命令
 */
export const disableAnalyticsCommand = new Command('disable')
  .description('禁用使用统计')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      analytics.disable();

      console.log(chalk.green('✓ 使用统计已禁用\n'));
      logger.info('使用统计已禁用');
    } catch (error) {
      console.log(chalk.red(`禁用统计失败: ${error}\n`));
      logger.error('禁用统计失败', { error });
    }
  });

/**
 * 清空统计子命令
 */
export const clearAnalyticsCommand = new Command('clear')
  .description('清空本地统计事件')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      analytics.clearEvents();

      console.log(chalk.green('✓ 本地统计事件已清空\n'));
      logger.info('本地统计事件已清空');
    } catch (error) {
      console.log(chalk.red(`清空统计失败: ${error}\n`));
      logger.error('清空统计失败', { error });
    }
  });

/**
 * 统计状态子命令
 */
export const statusAnalyticsCommand = new Command('status')
  .description('查看统计状态')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      const stats = analytics.getStats();

      console.log(chalk.cyan('\n📊 统计状态 / Analytics Status\n'));

      console.log(chalk.gray('状态 / Status:'));
      console.log(
        `  ${stats.enabled ? chalk.green('✓ 已启用 / Enabled') : chalk.gray('○ 已禁用 / Disabled')}`
      );

      if (stats.enabled) {
        console.log(chalk.gray('\n统计信息 / Statistics:'));
        console.log(`  本地事件数 / Local events: ${stats.eventCount}`);
        if (stats.endpoint) {
          console.log(`  统计端点 / Endpoint: ${stats.endpoint}`);
        }
      } else {
        console.log(chalk.gray('\n提示 / Note:'));
        console.log(chalk.gray('  使用统计已禁用，不会收集任何使用数据'));
        console.log(chalk.gray('  使用 "pnce analytics enable" 启用以帮助改进 CLI\n'));
      }
    } catch (error) {
      console.log(chalk.red(`获取状态失败: ${error}\n`));
      logger.error('获取统计状态失败', { error });
    }
  });

export function register(program: Command): void {
  const analyticsCmd = program.addCommand(analyticsCommand);
  analyticsCmd.addCommand(enableAnalyticsCommand);
  analyticsCmd.addCommand(disableAnalyticsCommand);
  analyticsCmd.addCommand(clearAnalyticsCommand);
  analyticsCmd.addCommand(statusAnalyticsCommand);
}