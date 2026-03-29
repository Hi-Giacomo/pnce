import { Command } from 'commander';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../types';
import { ErrorHandler } from '../utils/errors';
import { getConfigManager } from '../config/manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Register authentication-related commands
 * @param program - commander program instance
 * @param authService - Auth service instance
 */
export async function registerAuthCommands(
  program: Command,
  authService: AuthService
): Promise<void> {
  // Register command
  program
    .command('register')
    .description('Register new user')
    .option('-u, --username <username>', 'Username')
    .option('-e, --email <email>', 'email')
    .option('-p, --password <password>', 'password')
    .action(async (options) => {
      try {
        const response = await authService.register(options);
        // Token automatically saved to configuration by AuthService
        logger.info(
          `✓ Registration successful! User: ${response.user.username || response.user.email}`
        );
        console.log(
          `✓ Registration successful! User: ${response.user.username || response.user.email}`
        );
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // login command
  program
    .command('login')
    .description('login to registry (automatically opens browser for authorization)')
    .option('-e, --email <email>', 'email (optional, for traditional login method)')
    .option('-p, --password <password>', 'password (optional, for traditional login method)')
    .action(async (options) => {
      try {
        let response: AuthResponse;

        // If email and password are provided, use traditional login method
        if (options.email && options.password) {
          response = await authService.login(options);
        } else {
          // Default use web-based authorization login
          response = await authService.webLogin();
        }

        // Token automatically saved to configuration by AuthService
        logger.info(`✓ login successful! User: ${response.user.username || response.user.email}`);
        console.log(`✓ login successful! User: ${response.user.username || response.user.email}`);
        logger.info('Hint: You can now upload modules using command: pnce upload');
        console.log('');
        console.log('💡 Hint: You can now upload modules using command: pnce upload');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // View UserInfo command
  program
    .command('me')
    .description('View current UserInformation')
    .action(async () => {
      try {
        const configManager = getConfigManager();

        if (!configManager.getToken()) {
          logger.info('Not logged in');
          console.log('Not logged in');
          logger.info('Please use the following command to login:');
          console.log('Please use the following command to login:');
          logger.info('  pnce login');
          console.log('  pnce login');
          return;
        }

        const user = await authService.me();
        logger.info('Current UserInformation:');
        console.log('Current UserInformation:');
        logger.info(`  Username: ${user.username || 'N/A'}`);
        console.log(`  Username: ${user.username || 'N/A'}`);
        logger.info(`  email: ${user.email || 'N/A'}`);
        console.log(`  email: ${user.email || 'N/A'}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // logout command
  program
    .command('logout')
    .description('logout')
    .action(() => {
      try {
        const configManager = getConfigManager();
        configManager.clearAuth();
        logger.info('✓ Logged out');
        console.log('✓ Logged out');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
