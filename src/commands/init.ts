import { command } from 'commander';
import { ConfigManager } from '../config/manager';
import { getLogger } from '../utils/logger';
import readline from 'readline';
import chalk from 'chalk';

const logger = getLogger();

/**
 * Interactive Configuration Wizard
 */
export const initcommand = new command('init')
  .description('Interactive configuration wizard - Setup PNCE CLI')
  .action(async () => {
    logger.info('Starting interactive configuration wizard');
    console.log(chalk.cyan('\n🚀 PNCE CLI Configuration Wizard\n'));
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
      console.log(chalk.yellow('Step 1/3: Configure Server'));
      const serverUrl =
        (await question('  Enter server URL (press Enter to use default): ')) ||
        'https://pnce.example.com';
      config.serverUrl = serverUrl;

      // Log level
      console.log('\n' + chalk.yellow('Step 2/3: Configure Log Level'));
      console.log(chalk.gray('  Options: debug, info, warn, error (default: info)'));
      const logLevel = (await question('  Enter log level: ')) || 'info';
      config.logLevel = ['debug', 'info', 'warn', 'error'].includes(logLevel) ? logLevel : 'info';

      // Proxy settings
      console.log('\n' + chalk.yellow('Step 3/3: Configure Proxy (Optional)'));
      const useProxy = await question('  Use proxy? (y/N): ');
      if (useProxy.toLowerCase() === 'y' || useProxy.toLowerCase() === 'yes') {
        const proxyUrl = await question('  Enter proxy URL (e.g., http://127.0.0.1:7890): ');
        config.proxyUrl = proxyUrl;
      }

      // Save configuration
      console.log('\n' + chalk.cyan('💾 Saving configuration...'));
      configManager.setUserConfig(config);

      console.log(chalk.green('\n✅ Configuration complete!\n'));
      console.log(chalk.gray('Configuration file location: '));
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}`));
      console.log(chalk.gray('\nYou can use `pnce config` to view or modify configuration\n'));

      logger.info('Configuration wizard complete', { config });
    } catch (error) {
      logger.error('Configuration wizard failed', { error });
      console.log(chalk.red('\n❌ Configuration failed: ' + (error as Error).message));
    } finally {
      rl.close();
    }
  });

export function register(program: command): void {
  program.addcommand(initcommand);
}
