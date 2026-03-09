import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { getProfileManager } from '../utils/profile-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Configuration profile command
 */
export const profileCommand = new Command('profile')
  .description('Manage configuration profiles (multi-config switching)')
  .action(() => {
    const profileManager = getProfileManager();
    const profiles = profileManager.list();
    const currentProfile = profileManager.getCurrent();

    console.log(chalk.cyan('\n📁 Configuration Profiles\n'));

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
export const saveProfileCommand = new Command('save')
  .argument('<name>', 'Profile name')
  .description('Save current config as profile')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = configManager.getConfig();
      profileManager.save(name, config);

      console.log(chalk.green(`✓ Configuration profile saved: ${name}\n`));
      logger.info(`Configuration profile saved: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`Failed to save profile: ${error}\n`));
      logger.error('Failed to save configuration profile', { error });
    }
  });

/**
 * Load profile subcommand
 */
export const loadProfileCommand = new Command('load')
  .argument('<name>', 'Profile name')
  .description('Load configuration profile (without switching current profile)')
  .action(async (name: string) => {
    try {
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ Configuration profile not found: ${name}\n`));
        return;
      }

      console.log(chalk.cyan(`📄 Profile Content: ${name}\n`));
      console.log(chalk.white(JSON.stringify(config, null, 2)));
      console.log(chalk.gray('\nTip: Use "pnce profile use <name>" to switch to this profile\n'));
      logger.info(`Viewed configuration profile: ${name}`);
    } catch (error: unknown) {
      console.log(chalk.red(`Failed to load profile: ${error}\n`));
      logger.error('Failed to load configuration profile', { error });
    }
  });

/**
 * Use profile subcommand
 */
export const useProfileCommand = new Command('use')
  .argument('<name>', 'Profile name')
  .description('Switch to specified configuration profile')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ Configuration profile not found: ${name}\n`));
        return;
      }

      // Update configuration file
      configManager.setUserConfig(config);

      // Set as current profile
      profileManager.setCurrent(name);

      console.log(chalk.green(`✓ Switched to configuration profile: ${name}\n`));
      logger.info(`Switched to configuration profile: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`Failed to switch profile: ${error}\n`));
      logger.error('Failed to switch configuration profile', { error });
    }
  });

/**
 * List profiles subcommand
 */
export const listProfileCommand = new Command('list')
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
export const deleteProfileCommand = new Command('delete')
  .argument('<name>', 'Profile name')
  .description('Delete configuration profile')
  .action((name: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.delete(name);

      console.log(chalk.green(`✓ Configuration profile deleted: ${name}\n`));
      logger.info(`Configuration profile deleted: ${name}`);
    } catch (error) {
      console.log(chalk.red(`Failed to delete profile: ${error}\n`));
      logger.error(
        'Failed to delete configuration profile',
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
    }
  });

/**
 * Rename profile subcommand
 */
export const renameProfileCommand = new Command('rename')
  .argument('<oldName>', 'Old profile name')
  .argument('<newName>', 'New profile name')
  .description('Rename configuration profile')
  .action((oldName: string, newName: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.rename(oldName, newName);

      console.log(chalk.green(`✓ Configuration profile renamed: ${oldName} -> ${newName}\n`));
      logger.info(`Configuration profile renamed: ${oldName} -> ${newName}`);
    } catch (error) {
      console.log(chalk.red(`Failed to rename profile: ${error}\n`));
      logger.error(
        'Failed to rename configuration profile',
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
    }
  });

export function register(program: Command): void {
  const profileCmd = program.addCommand(profileCommand);
  profileCmd.addCommand(saveProfileCommand);
  profileCmd.addCommand(loadProfileCommand);
  profileCmd.addCommand(useProfileCommand);
  profileCmd.addCommand(listProfileCommand);
  profileCmd.addCommand(deleteProfileCommand);
  profileCmd.addCommand(renameProfileCommand);
}
