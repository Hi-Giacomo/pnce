import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loadEnvfile, updateEnvfile, deleteEnvfile as deleteEnv } from '../../config/env.config';

@Injectable()
export class EnvService {
  private readonly logger = new Logger(EnvService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * AllEnvironment variables
   */
  getAllEnv(): Record<string, string> {
    return loadEnvfile();
  }

  /**
   * Environment variables
   */
  getEnv(key: string): string {
    return process.env[key] || loadEnvfile()[key];
  }

  /**
   * Get configuration
   */
  getConfig() {
    return this.configService.get('env');
  }

  /**
   * Environment variables(，)
   */
  setEnv(key: string, value: string): { success: boolean; message: string; needRestart?: boolean } {
    try {
      const oldValue = process.env[key];
      updateEnvfile(key, value);

      //  process.env
      process.env[key] = value;

      // Yes/No
      const needRestart = ['PORT', 'NODE_ENV'].includes(key) && oldValue !== value;

      if (needRestart) {
        this.logger.warn(`Environment variables ${key}  ${oldValue}  ${value}`);
        this.logger.log('serviceRestart...');

        // ，CurrentRequest
        setImmediate(() => {
          this.logger.log('ProcessingExecuteserviceRestart...');
          if (typeof (global as any).restartServer === 'function') {
            (global as any).restartServer();
            this.logger.log('restartServer Function');
          } else {
            this.logger.error('restartServer FunctionUndefined');
          }
        });

        return {
          success: true,
          message: `Environment variables ${key} Update successful，serviceProcessingRestartMedium...`,
          needRestart: true,
        };
      }

      this.logger.log(`Environment variablesUpdate: ${key}=${value}`);
      return {
        success: true,
        message: `Environment variables ${key} Update successful`,
        needRestart: false,
      };
    } catch (error) {
      this.logger.error(`UpdateEnvironment variablesfailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variables ${key} Updatefailed: ${error.message}`,
        needRestart: false,
      };
    }
  }

  /**
   * Environment variables
   */
  setBatchEnv(envVars: Record<string, string>): {
    success: boolean;
    message: string;
    updated: string[];
    failed: Array<{ key: string; error: string }>;
  } {
    const updated: string[] = [];
    const failed: Array<{ key: string; error: string }> = [];

    try {
      Object.entries(envVars).forEach(([key, value]) => {
        try {
          updateEnvfile(key, value);
          updated.push(key);
          this.logger.log(`Environment variablesUpdate: ${key}=${value}`);
        } catch (error) {
          failed.push({ key, error: error.message });
          this.logger.error(`UpdateEnvironment variablesfailed: ${key} - ${error.message}`);
        }
      });

      return {
        success: failed.length === 0,
        message: `UpdateComplete: Success ${updated.length} , failed ${failed.length} `,
        updated,
        failed,
      };
    } catch (error) {
      return {
        success: false,
        message: `Updatefailed: ${error.message}`,
        updated,
        failed,
      };
    }
  }

  /**
   * Environment variables
   */
  deleteEnv(key: string): { success: boolean; message: string } {
    try {
      deleteEnv(key);
      this.logger.log(`Environment variablesDelete: ${key}`);
      return {
        success: true,
        message: `Environment variables ${key} DeleteSuccess`,
      };
    } catch (error) {
      this.logger.error(`DeleteEnvironment variablesfailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variables ${key} Deletefailed: ${error.message}`,
      };
    }
  }

  /**
   * AllEnvironment variables(file)
   */
  reloadEnv(): { success: boolean; message: string; config: Record<string, string> } {
    try {
      const envVars = loadEnvfile();

      //  process.env
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });

      this.logger.log('Environment variablesReload');
      return {
        success: true,
        message: 'Environment variablesReloadSuccess',
        config: envVars,
      };
    } catch (error) {
      this.logger.error(`ReloadEnvironment variablesfailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variablesReloadfailed: ${error.message}`,
        config: {},
      };
    }
  }

  /**
   * Get specific configuration item
   */
  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }
}
