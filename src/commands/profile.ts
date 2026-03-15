import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { getProfileManager } from '../utils/profile-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Config profile command
 */
export const profilecommand = new Command('profile')
  .description('Manage configuration profiles (multi-config switching)')
  .action(() => {
    const profileManager = getProfileManager();
    const profiles = profileManager.list();
    const currentProfile = profileManager.getCurrent();

    console.log(chalk.cyan('\n📁 Config Profiles\n'));

    if (profiles.length === 0) {
      console.log(chalk.gray('No profiles configured\n'));
    } else {
      profiles.forEach((profile) => {
        const isCurrent = profile.name === currentProfile;
        const status = isCurrent ? chalk.green('(current)') : '';
        const updatedAt = new Date(profile.updatedAt).toLocaleString('en-US');

        console.log(
          `${isCurrent ? chalk.green('●') : chalk.gray('○')} ${chalk.white(profile.name)} ${status}`
        );
        console.log(chalk.gray(`  Updated: ${updatedAt}\n`));
      });
    }

    console.log(chalk.gray('Usage:'));
    console.log('  pnce profile save <name>   - Save current config as profile');
    console.log('  pnce profile load <name>   - Load profile');
    console.log('  pnce profile use <name>    - Switch to profile');
    console.log('  pnce profile list          - List all profiles');
    console.log('  pnce profile delete <name> - Delete profile');
    console.log('  pnce profile rename <old> <new> - Rename profile');
  });

/**
 * Save profile subcommand
 */
export const saveProfilecommand = new Command('save')
  .argument('<name>', 'Profile name')
  .description('Save current config as profile')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = configManager.getConfig();
      profileManager.save(name, config);

      console.log(chalk.green(`✓ Config profile saved: ${name}\n`));
      logger.info(`Config profile saved: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`failed to save profile: ${error}\n`));
      logger.error('failed to save configuration profile', { error });
    }
  });

/**
 * Load profile subcommand
 */
export const loadProfilecommand = new Command('load')
  .argument('<name>', 'Profile name')
  .description('Load configuration profile (without switching current profile)')
  .action(async (name: string) => {
    try {
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ Config profile not found: ${name}\n`));
        return;
      }

      console.log(chalk.cyan(`📄 Profile Content: ${name}\n`));
      console.log(chalk.white(JSON.stringify(config, null, 2)));
      console.log(chalk.gray('\nTip: Use "pnce profile use <name>" to switch to this profile\n'));
      logger.info(`Viewed configuration profile: ${name}`);
    } catch (error: unknown) {
      console.log(chalk.red(`failed to load profile: ${error}\n`));
      logger.error('failed to load configuration profile', { error });
    }
  });

/**
 * Use profile subcommand
 */
export const useProfilecommand = new Command('use')
  .argument('<name>', 'Profile name')
  .description('Switch to specified configuration profile')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ Config profile not found: ${name}\n`));
        return;
      }

      // Update configuration file
      configManager.setUserConfig(config);

      // Set as current profile
      profileManager.setCurrent(name);

      console.log(chalk.green(`✓ Switched to configuration profile: ${name}\n`));
      logger.info(`Switched to configuration profile: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`failed to switch profile: ${error}\n`));
      logger.error('failed to switch configuration profile', { error });
    }
  });

/**
 * List profiles subcommand
 */
export const listProfilecommand = new Command('list')
  .description('List all configuration profiles')
  .action(() => {
    const profileManager = getProfileManager();
    const profiles = profileManager.list();
    const currentProfile = profileManager.getCurrent();

    console.log(chalk.cyan('\n📁 Profile List\n'));

    if (profiles.length === 0) {
      console.log(chalk.gray('No profiles configured\n'));
    } else {
      profiles.forEach((profile) => {
        const isCurrent = profile.name === currentProfile;
        const status = isCurrent ? chalk.green('(current)') : '';
        const updatedAt = new Date(profile.updatedAt).toLocaleString('en-US');

        console.log(
          `${isCurrent ? chalk.green('●') : chalk.gray('○')} ${chalk.white(profile.name)} ${status}`
        );
        console.log(chalk.gray(`  Updated: ${updatedAt}\n`));
      });
    }
  });

/**
 * Delete profile subcommand
 */
export const deleteProfilecommand = new Command('delete')
  .argument('<name>', 'Profile name')
  .description('Delete configuration profile')
  .action((name: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.delete(name);

      console.log(chalk.green(`✓ Config profile deleted: ${name}\n`));
      logger.info(`Config profile deleted: ${name}`);
    } catch (error) {
      console.log(chalk.red(`failed to delete profile: ${error}\n`));
      logger.error(
        'failed to delete configuration profile',
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
    }
  });

/**
 * Rename profile subcommand
 */
export const renameProfilecommand = new Command('rename')
  .argument('<oldName>', 'Old profile name')
  .argument('<newName>', 'New profile name')
  .description('Rename configuration profile')
  .action((oldName: string, newName: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.rename(oldName, newName);

      console.log(chalk.green(`✓ Config profile renamed: ${oldName} -> ${newName}\n`));
      logger.info(`Config profile renamed: ${oldName} -> ${newName}`);
    } catch (error) {
      console.log(chalk.red(`failed to rename profile: ${error}\n`));
      logger.error(
        'failed to rename configuration profile',
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
    }
  });

export function register(program: Command): void {
  const profileCmd = program.addCommand(profilecommand);
  profileCmd.addCommand(saveProfilecommand);
  profileCmd.addCommand(loadProfilecommand);
  profileCmd.addCommand(useProfilecommand);
  profileCmd.addCommand(listProfilecommand);
  profileCmd.addCommand(deleteProfilecommand);
  profileCmd.addCommand(renameProfilecommand);
}
