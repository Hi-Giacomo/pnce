import { Command } from 'commander';
import chalk from 'chalk';
import { getAnalyticsManager } from '../utils/analytics';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Analytics command
 */
export const analyticscommand = new Command('analytics')
  .description('Manage usage analytics (optional)')
  .action(() => {
    const analytics = getAnalyticsManager();
    const stats = analytics.getStats();

    console.log(chalk.cyan('\n📊 Usage Analytics\n'));

    console.log(chalk.gray('Status:'));
    console.log(`  ${stats.enabled ? chalk.green('✓ Enabled') : chalk.gray('○ Disabled')}`);

    if (stats.enabled) {
      console.log(chalk.gray('\nStatistics:'));
      console.log(`  Local events: ${stats.eventCount}`);
      if (stats.endpoint) {
        console.log(`  Endpoint: ${stats.endpoint}`);
      }
    }

    console.log(chalk.gray('\nUsage:'));
    console.log('  pnce analytics enable  [endpoint]  - Enable analytics');
    console.log('  pnce analytics disable              - Disable analytics');
    console.log('  pnce analytics clear                 - Clear local events');
    console.log('  pnce analytics status                - Show status');
  });

/**
 * Enable analytics subcommand
 */
export const enableAnalyticscommand = new Command('enable')
  .argument('[endpoint]', 'Analytics endpoint (optional)')
  .description('Enable usage analytics')
  .action((endpoint?: string) => {
    try {
      const analytics = getAnalyticsManager();
      analytics.enable(endpoint);

      console.log(chalk.green('✓ Usage analytics enabled\n'));
      if (endpoint) {
        console.log(chalk.gray(`Analytics endpoint: ${endpoint}\n`));
      }
      console.log(chalk.gray('Thank you for helping improve PNCE CLI!\n'));
      logger.info('Usage analytics enabled', { endpoint });
    } catch (error) {
      console.log(chalk.red(`failed to enable analytics: ${error}\n`));
      logger.error('failed to enable analytics', { error });
    }
  });

/**
 * Disable analytics subcommand
 */
export const disableAnalyticscommand = new Command('disable')
  .description('Disable usage analytics')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      analytics.disable();

      console.log(chalk.green('✓ Usage analytics disabled\n'));
      logger.info('Usage analytics disabled');
    } catch (error) {
      console.log(chalk.red(`failed to disable analytics: ${error}\n`));
      logger.error('failed to disable analytics', { error });
    }
  });

/**
 * Clear analytics subcommand
 */
export const clearAnalyticscommand = new Command('clear')
  .description('Clear local analytics events')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      analytics.clearEvents();

      console.log(chalk.green('✓ Local analytics events cleared\n'));
      logger.info('Local analytics events cleared');
    } catch (error) {
      console.log(chalk.red(`failed to clear analytics: ${error}\n`));
      logger.error('failed to clear analytics', { error });
    }
  });

/**
 * Analytics status subcommand
 */
export const statusAnalyticscommand = new Command('status')
  .description('Show analytics status')
  .action(() => {
    try {
      const analytics = getAnalyticsManager();
      const stats = analytics.getStats();

      console.log(chalk.cyan('\n📊 Analytics Status\n'));

      console.log(chalk.gray('Status:'));
      console.log(`  ${stats.enabled ? chalk.green('✓ Enabled') : chalk.gray('○ Disabled')}`);

      if (stats.enabled) {
        console.log(chalk.gray('\nStatistics:'));
        console.log(`  Local events: ${stats.eventCount}`);
        if (stats.endpoint) {
          console.log(`  Endpoint: ${stats.endpoint}`);
        }
      } else {
        console.log(chalk.gray('\nNote:'));
        console.log(chalk.gray('  Usage analytics is disabled, no usage data will be collected'));
        console.log(chalk.gray('  Use "pnce analytics enable" to help improve the CLI\n'));
      }
    } catch (error) {
      console.log(chalk.red(`failed to get status: ${error}\n`));
      logger.error('failed to get analytics status', { error });
    }
  });

export function register(program: Command): void {
  const analyticsCmd = program.addCommand(analyticscommand);
  analyticsCmd.addCommand(enableAnalyticscommand);
  analyticsCmd.addCommand(disableAnalyticscommand);
  analyticsCmd.addCommand(clearAnalyticscommand);
  analyticsCmd.addCommand(statusAnalyticscommand);
}
