import { Command } from 'commander';
import { getConfigManager } from '../config/manager';
import { ErrorHandler } from '../utils/errors';

/**
 * Register registry management commands
 * @param program - Commander program instance
 */
export function registerRegistryCommands(program: Command): void {
  const registryCmd = program.command('registry').description('Manage registry mirrors');

  // Set registry URL
  registryCmd
    .command('set <url>')
    .description('Set module service download URL')
    .action((url) => {
      try {
        const configManager = getConfigManager();
        configManager.setUserConfig({ apiServer: url });
        const config = configManager.getConfig();
        console.log('✓ Module service download URL updated');
        console.log(`  URL: ${config.apiServer}`);
      } catch (error: unknown) {
        console.error('Set failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Get current registry URL
  registryCmd
    .command('get')
    .description('View current module service download URL')
    .action(() => {
      try {
        const config = getConfigManager().getConfig();
        console.log('Current module service download URL:');
        console.log(`  URL: ${config.apiServer}`);
        console.log(`  Authentication token: ${config.token ? 'Set' : 'Not set'}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // Validate registry connection
  registryCmd
    .command('ping')
    .description('Validate module service connection')
    .action(async () => {
      try {
        const config = getConfigManager().getConfig();
        console.log(`Connecting to ${config.apiServer}...`);

        const axios = require('axios');
        await axios.get(`${config.apiServer}/health`, { timeout: 5000 }).catch(() => {
          // health endpoint does not exist
          return axios.get(config.apiServer, { timeout: 5000 });
        });

        console.log('✓ Connection successful');
        console.log(`  URL: ${config.apiServer}`);
      } catch (error: unknown) {
        console.error('✗ Connection failed:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && 'code' in error && error.code === 'ECONNREFUSED') {
          console.error('  Please confirm if module service is running');
        }
        process.exit(1);
      }
    });

  // Reset to default
  registryCmd
    .command('reset')
    .description('Reset to default module service URL')
    .action(() => {
      try {
        const configManager = getConfigManager();
        configManager.setUserConfig({ apiServer: 'http://62.234.36.178:3000' });
        const config = configManager.getConfig();
        console.log('✓ Reset to default configuration');
        console.log(`  URL: ${config.apiServer}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
