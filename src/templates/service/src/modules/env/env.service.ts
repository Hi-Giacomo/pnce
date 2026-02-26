import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  loadEnvFile,
  updateEnvFile,
  deleteEnvFile as deleteEnv,
} from '../../config/env.config';

@Injectable()
export class EnvService {
  private readonly logger = new Logger(EnvService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取所有环境变量
   */
  getAllEnv(): Record<string, string> {
    return loadEnvFile();
  }

  /**
   * 获取单个环境变量
   */
  getEnv(key: string): string {
    return process.env[key] || loadEnvFile()[key];
  }

  /**
   * 获取配置对象
   */
  getConfig() {
    return this.configService.get('env');
  }

  /**
   * 设置环境变量(动态更新，不中断服务)
   */
  setEnv(key: string, value: string): { success: boolean; message: string; needRestart?: boolean } {
    try {
      const oldValue = process.env[key];
      updateEnvFile(key, value);

      // 更新 process.env 使其立即生效
      process.env[key] = value;

      // 检查是否需要重启服务
      const needRestart = ['PORT', 'NODE_ENV'].includes(key) && oldValue !== value;

      if (needRestart) {
        this.logger.warn(`环境变量 ${key} 从 ${oldValue} 变更为 ${value}`);
        this.logger.log('准备触发服务重启...');

        // 异步重启服务，不阻塞当前请求
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
          message: `环境变量 ${key} 更新成功，服务正在自动重启中...`,
          needRestart: true,
        };
      }

      this.logger.log(`环境变量已更新: ${key}=${value}`);
      return {
        success: true,
        message: `环境变量 ${key} 更新成功`,
        needRestart: false,
      };
    } catch (error) {
      this.logger.error(`更新环境变量失败: ${error.message}`);
      return {
        success: false,
        message: `环境变量 ${key} 更新失败: ${error.message}`,
        needRestart: false,
      };
    }
  }

  /**
   * 批量设置环境变量
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
          this.logger.log(`环境变量已更新: ${key}=${value}`);
        } catch (error) {
          failed.push({ key, error: error.message });
          this.logger.error(`更新环境变量失败: ${key} - ${error.message}`);
        }
      });

      return {
        success: failed.length === 0,
        message: `批量更新完成: 成功 ${updated.length} 个, 失败 ${failed.length} 个`,
        updated,
        failed,
      };
    } catch (error) {
      return {
        success: false,
        message: `批量更新失败: ${error.message}`,
        updated,
        failed,
      };
    }
  }

  /**
   * 删除环境变量
   */
  deleteEnv(key: string): { success: boolean; message: string } {
    try {
      deleteEnv(key);
      this.logger.log(`环境变量已删除: ${key}`);
      return {
        success: true,
        message: `环境变量 ${key} 删除成功`,
      };
    } catch (error) {
      this.logger.error(`删除环境变量失败: ${error.message}`);
      return {
        success: false,
        message: `环境变量 ${key} 删除失败: ${error.message}`,
      };
    }
  }

  /**
   * 重载所有环境变量(从文件重新读取)
   */
  reloadEnv(): { success: boolean; message: string; config: Record<string, string> } {
    try {
      const envVars = loadEnvFile();
      
      // 更新 process.env
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });
     
      
      this.logger.log('环境变量已重载');
      return {
        success: true,
        message: '环境变量重载成功',
        config: envVars,
      };
    } catch (error) {
      this.logger.error(`重载环境变量失败: ${error.message}`);
      return {
        success: false,
        message: `环境变量重载失败: ${error.message}`,
        config: {},
      };
    }
  }

  /**
   * 获取特定配置项
   */
  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }
}

