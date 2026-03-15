import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { EnvService } from './env.service';

@Controller('env')
export class EnvController {
  constructor(private readonly envService: EnvService) {}

  /**
   * AllEnvironment variables
   */
  @Get()
  getAllEnv() {
    return {
      success: true,
      data: this.envService.getAllEnv(),
    };
  }

  /**
   * Environment variables
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
   * Get configuration
   */
  @Get('config/all')
  getConfig() {
    return {
      success: true,
      data: this.envService.getConfig(),
    };
  }

  /**
   * Environment variables
   */
  @Post()
  setEnv(@Body() body: { key: string; value: string }) {
    const { key, value } = body;

    if (!key || value === undefined) {
      return {
        success: false,
        message: 'Argument， key  value',
      };
    }

    return this.envService.setEnv(key, value);
  }

  /**
   * Environment variables
   */
  @Post('batch')
  setBatchEnv(@Body() body: { envVars: Record<string, string> }) {
    const { envVars } = body;

    if (!envVars || Object.keys(envVars).length === 0) {
      return {
        success: false,
        message: 'Argument， envVars Object',
      };
    }

    return this.envService.setBatchEnv(envVars);
  }

  /**
   * Environment variables
   */
  @Delete(':key')
  deleteEnv(@Param('key') key: string) {
    return this.envService.deleteEnv(key);
  }

  /**
   * Environment variables
   */
  @Post('reload')
  reloadEnv() {
    return this.envService.reloadEnv();
  }
}
