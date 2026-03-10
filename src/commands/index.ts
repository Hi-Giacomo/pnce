import { command } from 'commander';
import { ApiService } from '../services/api.service';
import { moduleService } from '../services/module.service';
import { moduleUploadService } from '../services/module-upload.service';
import { moduleDownloadService } from '../services/module-download.service';
import { AuthService } from '../services/auth.service';
import { modulesManagerService } from '../services/modules-manager.service';
import { getLogger, initLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

// command
import { registerAuthcommands } from './auth.commands';
import { registermodulecommands } from './module.commands';
import { registerInstallcommands } from './install.commands';
import { registerInitcommands } from './init.commands';
import { registermodulesManagercommands } from './modules-manager.commands';
import { registerPortcommands } from './port.commands';
import { registerRegistrycommands } from './registry.commands';
import { register as registerLangcommand } from './lang';
import { register as registerAliascommand } from './alias';
import { register as registerConfigValidatecommand } from './config-validate';
import { register as registerAnalyticscommand } from './analytics';
import { register as registerProfilecommand } from './profile';
import { register as registerPlugincommand } from './plugin';

/**
 * Allcommand
 */
export async function registercommands(program: command): Promise<void> {
  try {
    // 
    await initLogger();
    const logger = getLogger();

    // 
    const api = new ApiService(logger);
    const moduleDownloadService = new moduleDownloadService(api, logger);
    const moduleUploadService = new moduleUploadService(api, logger);
    const moduleService = new moduleService(api);
    const authService = new AuthService(api);
    const modulesManager = new modulesManagerService(api, moduleService);

    // modulecommand
    registerAuthcommands(program, authService);
    registermodulecommands(program, moduleUploadService, moduleDownloadService);
    registerInstallcommands(program, moduleDownloadService, modulesManager, api);
    registerInitcommands(program);
    registermodulesManagercommands(program, modulesManager);
    registerPortcommands(program);
    registerRegistrycommands(program);
    registerLangcommand(program);
    registerAliascommand(program);
    registerConfigValidatecommand(program);
    registerAnalyticscommand(program);
    registerProfilecommand(program);
    registerPlugincommand(program);

    logger.debug('Allcommand注册Complete');
  } catch (error) {
    ErrorHandler.handle(error);
  }
}
