import { Command } from 'commander';
import { ApiService } from '../services/api.service';
import { moduleService } from '../services/module.service';
import { moduleUploadService } from '../services/module-upload.service';
import { moduleDownloadService } from '../services/module-download.service';
import { AuthService } from '../services/auth.service';
import { modulesManagerService } from '../services/modules-manager.service';
import { getLogger, initLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

// command
import { registerAuthCommands } from './auth.commands';
import { registermodulecommands } from './module.commands';
import { registerInstallCommands } from './install.commands';
import { registerInitCommands } from './init.commands';
import { registerModulesManagerCommands } from './modules-manager.commands';
import { registerPortCommands } from './port.commands';
import { registerRegistryCommands } from './registry.commands';
import { register as registerLangcommand } from './lang';
import { register as registerAliascommand } from './alias';
import { register as registerconfigValidateCommand } from './config-validate';
import { register as registerAnalyticscommand } from './analytics';
import { register as registerProfilecommand } from './profile';
import { register as registerPlugincommand } from './plugin';

/**
 * Allcommand
 */
export async function registercommands(program: Command): Promise<void> {
  try {
    //
    await initLogger();
    const logger = getLogger();

    //
    const api = new ApiService(logger);
    const downloadService = new moduleDownloadService(api, logger);
    const uploadService = new moduleUploadService(api, logger);
    const modService = new moduleService(api);
    const authService = new AuthService(api);
    const modulesManager = new modulesManagerService(api, modService);

    // modulecommand
    registerAuthCommands(program, authService);
    registermodulecommands(program, uploadService, downloadService);
    registerInstallCommands(program, downloadService, modulesManager, api);
    registerInitCommands(program);
    registerModulesManagerCommands(program, modulesManager);
    registerPortCommands(program);
    registerRegistryCommands(program);
    registerLangcommand(program);
    registerAliascommand(program);
    registerconfigValidateCommand(program);
    registerAnalyticscommand(program);
    registerProfilecommand(program);
    registerPlugincommand(program);

    logger.debug('AllcommandRegisterComplete');
  } catch (error) {
    ErrorHandler.handle(error);
  }
}
