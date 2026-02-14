import { Command } from 'commander';
import { ApiService } from '../services/api.service';
import { ModuleService } from '../services/module.service';
import { AuthService } from '../services/auth.service';
import { ModulesManagerService } from '../services/modules-manager.service';

// 导入命令注册函数
import { registerAuthCommands } from './auth.commands';
import { registerModuleCommands } from './module.commands';
import { registerInstallCommands } from './install.commands';
import { registerInitCommands } from './init.commands';
import { registerModulesManagerCommands } from './modules-manager.commands';
import { registerPortCommands } from './port.commands';
import { registerRegistryCommands } from './registry.commands';

/**
 * 注册所有命令
 */
export function registerCommands(program: Command): void {
  // 初始化服务
  const api = new ApiService();
  const moduleService = new ModuleService(api);
  const authService = new AuthService(api);
  const modulesManager = new ModulesManagerService(api, moduleService);

  // 注册各模块命令
  registerAuthCommands(program, authService);
  registerModuleCommands(program, moduleService);
  registerInstallCommands(program, moduleService, modulesManager, api);
  registerInitCommands(program);
  registerModulesManagerCommands(program, modulesManager);
  registerPortCommands(program);
  registerRegistryCommands(program);
}
