import { Command } from 'commander';
import { ApiService } from '../services/api.service';
import { ModuleService } from '../services/module.service';
import { ModuleUploadService } from '../services/module-upload.service';
import { ModuleDownloadService } from '../services/module-download.service';
import { AuthService } from '../services/auth.service';
import { ModulesManagerService } from '../services/modules-manager.service';
import { getLogger, initLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

// 导入命令注册函数
import { registerAuthCommands } from './auth.commands';
import { registerModuleCommands } from './module.commands';
import { registerInstallCommands } from './install.commands';
import { registerInitCommands } from './init.commands';
import { registerModulesManagerCommands } from './modules-manager.commands';
import { registerPortCommands } from './port.commands';
import { registerRegistryCommands } from './registry.commands';
import { register as registerLangCommand } from './lang';
import { register as registerAliasCommand } from './alias';
import { register as registerConfigValidateCommand } from './config-validate';
import { register as registerAnalyticsCommand } from './analytics';
import { register as registerProfileCommand } from './profile';
import { register as registerPluginCommand } from './plugin';

/**
 * 注册所有命令
 */
export async function registerCommands(program: Command): Promise<void> {
  try {
    // 等待日志系统初始化
    await initLogger();
    const logger = getLogger();

    // 初始化服务
    const api = new ApiService(logger);
    const moduleDownloadService = new ModuleDownloadService(api, logger);
    const moduleUploadService = new ModuleUploadService(api, logger);
    const moduleService = new ModuleService(api);
    const authService = new AuthService(api);
    const modulesManager = new ModulesManagerService(api, moduleService);

    // 注册各模块命令
    registerAuthCommands(program, authService);
    registerModuleCommands(program, moduleUploadService, moduleDownloadService);
    registerInstallCommands(program, moduleDownloadService, modulesManager, api);
    registerInitCommands(program);
    registerModulesManagerCommands(program, modulesManager);
    registerPortCommands(program);
    registerRegistryCommands(program);
    registerLangCommand(program);
    registerAliasCommand(program);
    registerConfigValidateCommand(program);
    registerAnalyticsCommand(program);
    registerProfileCommand(program);
    registerPluginCommand(program);

    logger.debug('所有命令注册完成');
  } catch (error) {
    ErrorHandler.handle(error);
  }
}
