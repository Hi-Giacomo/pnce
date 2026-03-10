import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loadEnvFile, updateEnvFile, deleteEnvFile as deleteEnv } from '../../config/env.config';

@Injectable()
export class EnvService {
  private readonly logger = new Logger(EnvService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * AllEnvironment variables
   */
  getAllEnv(): Record<string, string> {
    return loadEnvFile();
  }

  /**
   * Environment variables
   */
  getEnv(key: string): string {
    return process.env[key] || loadEnvFile()[key];
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
      updateEnvFile(key, value);

      //  process.env 
      process.env[key] = value;

      // YesNo
      const needRestart = ['PORT', 'NODE_ENV'].includes(key) && oldValue !== value;

      if (needRestart) {
        this.logger.warn(`Environment variables ${key} 从 ${oldValue} 变更为 ${value}`);
        this.logger.log('准备触发服务重启...');

        // ，CurrentRequest
        setImmediate(() => {
          this.logger.log('正在执行服务重启...');
          if (typeof (global as any).restartServer === 'function') {
            (global as any).restartServer();
            this.logger.log('restartServer 函数已调用');
          } else {
            this.logger.error('restartServer 函数未定义');
          }
        });

        return {
          success: true,
          message: `Environment variables ${key} Update successful，服务正在自动重启中...`,
          needRestart: true,
        };
      }

      this.logger.log(`Environment variables已更新: ${key}=${value}`);
      return {
        success: true,
        message: `Environment variables ${key} Update successful`,
        needRestart: false,
      };
    } catch (error) {
      this.logger.error(`更新Environment variablesFailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variables ${key} 更新Failed: ${error.message}`,
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
          updateEnvFile(key, value);
          updated.push(key);
          this.logger.log(`Environment variables已更新: ${key}=${value}`);
        } catch (error) {
          failed.push({ key, error: error.message });
          this.logger.error(`更新Environment variablesFailed: ${key} - ${error.message}`);
        }
      });

      return {
        success: failed.length === 0,
        message: `批量更新Complete: Success ${updated.length} 个, Failed ${failed.length} 个`,
        updated,
        failed,
      };
    } catch (error) {
      return {
        success: false,
        message: `批量更新Failed: ${error.message}`,
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
      this.logger.log(`Environment variables已删除: ${key}`);
      return {
        success: true,
        message: `Environment variables ${key} 删除Success`,
      };
    } catch (error) {
      this.logger.error(`删除Environment variablesFailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variables ${key} 删除Failed: ${error.message}`,
      };
    }
  }

  /**
   * AllEnvironment variables(File)
   */
  reloadEnv(): { success: boolean; message: string; config: Record<string, string> } {
    try {
      const envVars = loadEnvFile();

      //  process.env
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });

      this.logger.log('Environment variables已重载');
      return {
        success: true,
        message: 'Environment variables重载Success',
        config: envVars,
      };
    } catch (error) {
      this.logger.error(`重载Environment variablesFailed: ${error.message}`);
      return {
        success: false,
        message: `Environment variables重载Failed: ${error.message}`,
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
