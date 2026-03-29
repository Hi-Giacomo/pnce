import { Command } from 'commander';
import { ConfigManager } from '../config/manager';
import { getLogger } from '../utils/logger';
import readline from 'readline';
import chalk from 'chalk';

const logger = getLogger();

/**
 * Interactive Config Wizard
 */
export const initcommand = new Command('init')
  .description('Interactive configuration wizard - Setup PNCE CLI')
  .action(async () => {
    logger.info('Starting interactive configuration wizard');
    logger.info('PNCE CLI Config Wizard displayed to user.');
    console.log(chalk.cyan('\n🚀 PNCE CLI Config Wizard\n'));
    logger.info('Displaying introductory message for config wizard.');
    console.log(chalk.gray('This wizard will help you configure basic settings for PNCE CLI\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const configManager = new ConfigManager();
    const config: Record<string, string> = {};

    // Create a helper function to get user input
    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      });
    };

    try {
      // Server address
      logger.info('Step 1: Configuring server URL.');
      console.log(chalk.yellow('Step 1/3: Configure Server'));
      const serverUrl =
        (await question('  Enter server URL (press Enter to use default): ')) ||
        'https://pnce.example.com';
      config.serverUrl = serverUrl;

      // Log level
      logger.info('Step 2: Configuring log level.');
      console.log('\n' + chalk.yellow('Step 2/3: Configure Log Level'));
      logger.info('Log level options displayed.');
      console.log(chalk.gray('  Options: debug, info, warn, error (default: info)'));
      const logLevel = (await question('  Enter log level: ')) || 'info';
      config.logLevel = ['debug', 'info', 'warn', 'error'].includes(logLevel) ? logLevel : 'info';

      // Proxy settings
      logger.info('Step 3: Configuring proxy settings (optional).');
      console.log('\n' + chalk.yellow('Step 3/3: Configure Proxy (Optional)'));
      const useProxy = await question('  Use proxy? (y/N): ');
      if (useProxy.toLowerCase() === 'y' || useProxy.toLowerCase() === 'yes') {
        const proxyUrl = await question('  Enter proxy URL (e.g., http://127.0.0.1:7890): ');
        config.proxyUrl = proxyUrl;
      }

      // Save configuration
      logger.info('Saving configuration.');
      console.log('\n' + chalk.cyan('💾 Saving configuration...'));
      configManager.setUserConfig(config);

      logger.info('Configuration complete.', { config });
      console.log(chalk.green('\n✅ Config complete!\n'));
      logger.info('Config file location displayed to user.');
      console.log(chalk.gray('Config file location: '));
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}`));
      logger.info('Instructions for viewing/modifying configuration displayed.');
      console.log(chalk.gray('\nYou can use `pnce config` to view or modify configuration\n'));

      logger.info('Config wizard complete', { config });
    } catch (error) {
      logger.error('Config wizard failed', { error });
      console.log(chalk.red('\n❌ Config failed: ' + (error as Error).message));
    } finally {
      rl.close();
    }
  });

export function register(program: Command): void {
  program.addCommand(initcommand);
}
