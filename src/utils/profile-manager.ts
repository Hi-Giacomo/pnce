import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import type { PnceConfig } from '../config/manager';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Config profile
 */
export interface ConfigProfile {
  /**
   *
   */
  name: string;

  /**
   *
   */
  config: PnceConfig;

  /**
   *
   */
  createdAt: number;

  /**
   *
   */
  updatedAt: number;
}

/**
 * Config profile
 */
export class ProfileManager {
  private profilesDir: string;
  private currentProfilefile: string;

  constructor(configDir?: string) {
    const configBaseDir = configDir || path.join(require('os').homedir(), '.pnce');
    this.profilesDir = path.join(configBaseDir, 'profiles');
    this.currentProfilefile = path.join(configBaseDir, '.current-profile');

    // Directory
    if (!existsSync(this.profilesDir)) {
      mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Save current configuration as profile
   * @param name -
   * @param config -
   */
  save(name: string, config: PnceConfig): void {
    try {
      const profile: ConfigProfile = {
        name,
        config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const profilePath = this.getProfilePath(name);
      writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');

      logger.info(`Config profileSave: ${name}`);
    } catch (error) {
      logger.error(`SaveConfig profilefailed: ${error}`);
      throw error;
    }
  }

  /**
   *
   * @param name -
   */
  load(name: string): PnceConfig | null {
    try {
      const profilePath = this.getProfilePath(name);

      if (!existsSync(profilePath)) {
        logger.warn(`Config profiledoes not exist: ${name}`);
        return null;
      }

      const content = readFileSync(profilePath, 'utf-8');
      const profile: ConfigProfile = JSON.parse(content);

      return profile.config;
    } catch (error) {
      logger.error(`LoadConfig profilefailed: ${error}`);
      return null;
    }
  }

  /**
   *
   * @param name -
   */
  delete(name: string): void {
    try {
      const profilePath = this.getProfilePath(name);

      if (!existsSync(profilePath)) {
        logger.warn(`Config profiledoes not exist: ${name}`);
        return;
      }

      unlinkSync(profilePath);

      // YesCurrent，Current
      if (this.getCurrent() === name) {
        this.clearCurrent();
      }

      logger.info(`Config profileDelete: ${name}`);
    } catch (error) {
      logger.error(`Delete configuration profilefailed: ${error}`);
      throw error;
    }
  }

  /**
   * All
   */
  list(): ConfigProfile[] {
    try {
      const fs = require('fs-extra');
      const files = fs.readdirSync(this.profilesDir);

      const profiles: ConfigProfile[] = [];

      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          try {
            const profilePath = path.join(this.profilesDir, file);
            const content = readFileSync(profilePath, 'utf-8');
            const profile: ConfigProfile = JSON.parse(content);
            profiles.push(profile);
          } catch (error) {
            logger.debug(
              `Loadfailed: ${file}`,
              error instanceof Error ? { error } : { error: String(error) }
            );
          }
        }
      });

      //
      return profiles.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      logger.error(`Config profilefailed: ${error}`);
      return [];
    }
  }

  /**
   * Current
   * @param name -
   */
  setCurrent(name: string): void {
    try {
      writeFileSync(this.currentProfilefile, name, 'utf-8');
      logger.info(`CurrentSetting: ${name}`);
    } catch (error) {
      logger.error(`SettingCurrentfailed: ${error}`);
      throw error;
    }
  }

  /**
   * Current
   */
  getCurrent(): string | null {
    try {
      if (!existsSync(this.currentProfilefile)) {
        return null;
      }

      const content = readFileSync(this.currentProfilefile, 'utf-8');
      const name = content.trim();

      // Yes/No
      if (!existsSync(this.getProfilePath(name))) {
        this.clearCurrent();
        return null;
      }

      return name;
    } catch (error) {
      logger.error(`GetCurrentfailed: ${error}`);
      return null;
    }
  }

  /**
   * Current
   */
  clearCurrent(): void {
    try {
      if (existsSync(this.currentProfilefile)) {
        unlinkSync(this.currentProfilefile);
        logger.info('CurrentClear');
      }
    } catch (error) {
      logger.error(`ClearCurrentfailed: ${error}`);
    }
  }

  /**
   *
   * @param oldName -
   * @param newName -
   */
  rename(oldName: string, newName: string): void {
    try {
      const oldPath = this.getProfilePath(oldName);
      const newPath = this.getProfilePath(newName);

      if (!existsSync(oldPath)) {
        throw new Error(`Config profiledoes not exist: ${oldName}`);
      }

      //
      const content = readFileSync(oldPath, 'utf-8');
      const profile: ConfigProfile = JSON.parse(content);
      profile.name = newName;
      profile.updatedAt = Date.now();

      writeFileSync(newPath, JSON.stringify(profile, null, 2), 'utf-8');
      unlinkSync(oldPath);

      // YesCurrent，Current
      if (this.getCurrent() === oldName) {
        this.setCurrent(newName);
      }

      logger.info(`Config profileRename: ${oldName} -> ${newName}`);
    } catch (error) {
      logger.error(`RenameConfig profilefailed: ${error}`);
      throw error;
    }
  }

  /**
   *
   * @param name -
   */
  private getProfilePath(name: string): string {
    return path.join(this.profilesDir, `${name}.json`);
  }

  /**
   * Directory
   */
  getProfilesDir(): string {
    return this.profilesDir;
  }
}

/**
 * Global
 */
let profileManagerInstance: ProfileManager | null = null;

/**
 *
 */
export function getProfileManager(): ProfileManager {
  if (!profileManagerInstance) {
    profileManagerInstance = new ProfileManager();
  }
  return profileManagerInstance;
}

/**
 *
 */
export function createProfileManager(configDir?: string): ProfileManager {
  return new ProfileManager(configDir);
}
