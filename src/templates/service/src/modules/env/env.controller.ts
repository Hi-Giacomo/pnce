import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { EnvService } from './env.service';

@Controller('env')
export class EnvController {
  constructor(private readonly envService: EnvService) {}

  /**
   * 获取所有环境变量
   */
  @Get()
  getAllEnv() {
    return {
      success: true,
      data: this.envService.getAllEnv(),
    };
  }

  /**
   * 获取单个环境变量
   */
  @Get(':key')
  getEnv(@Param('key') key: string) {
    const value = this.envService.getEnv(key);
    return {
      success: true,
      data: {
        key,
        value: value || null,
      },
    };
  }

  /**
   * 获取配置对象
   */
  @Get('config/all')
  getConfig() {
    return {
      success: true,
      data: this.envService.getConfig(),
    };
  }

  /**
   * 设置环境变量
   */
  @Post()
  setEnv(@Body() body: { key: string; value: string }) {
    const { key, value } = body;
    
    if (!key || value === undefined) {
      return {
        success: false,
        message: '参数不完整，需要 key 和 value',
      };
    }
    
    return this.envService.setEnv(key, value);
  }

  /**
   * 批量设置环境变量
   */
  @Post('batch')
  setBatchEnv(@Body() body: { envVars: Record<string, string> }) {
    const { envVars } = body;
    
    if (!envVars || Object.keys(envVars).length === 0) {
      return {
        success: false,
        message: '参数不完整，需要 envVars 对象',
      };
    }
    
    return this.envService.setBatchEnv(envVars);
  }

  /**
   * 删除环境变量
   */
  @Delete(':key')
  deleteEnv(@Param('key') key: string) {
    return this.envService.deleteEnv(key);
  }

  /**
   * 重载环境变量
   */
  @Post('reload')
  reloadEnv() {
    return this.envService.reloadEnv();
  }
}
