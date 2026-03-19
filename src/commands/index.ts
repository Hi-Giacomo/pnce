import { Command } from 'commander';
import { ApiService } from '../services/api.service';
import { moduleService } from '../services/module.service';
import { moduleUploadService } from '../services/module-upload.service';
import { moduleDownloadService } from '../services/module-download.service';
import { AuthService } from '../services/auth.service';
import { modulesManagerService } from '../services/modules-manager.service';
import { getLogger, initLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

// Commands
import { registerAuthCommands } from './auth.commands';
import { registermodulecommands } from './module.commands';
import { registerInstallCommands } from './install.commands';
import { registerInitCommands } from './init.commands';
import { registerModulesManagerCommands } from './modules-manager.commands';
import { registerPortCommands } from './port.commands';
import { registerPortKillCommands } from './port-kill.commands';
import { registerRegistryCommands } from './registry.commands';
import { register as registerLangcommand } from './lang';
import { register as registerAliascommand } from './alias';
import { register as registerconfigValidateCommand } from './config-validate';
import { register as registerAnalyticscommand } from './analytics';
import { register as registerProfilecommand } from './profile';
import { register as registerPlugincommand } from './plugin';
import { registerHelpCommand } from './help.commands';
import { registerHealthCommands } from './health.commands';
import { registerGatewayCommands } from './gateway.commands';
import { registerConfigReloadCommands } from './config-reload.commands';
import { registerLoggingCommands } from './logging.commands';

/**
 * Register all commands
 */
export async function registercommands(program: Command): Promise<void> {
  try {
    // Initialize logging
    await initLogger();
    const logger = getLogger();

    // Initialize services
    const api = new ApiService(logger);
    const downloadService = new moduleDownloadService(api, logger);
    const uploadService = new moduleUploadService(api, logger);
    const modService = new moduleService(api);
    const authService = new AuthService(api);
    const modulesManager = new modulesManagerService(api, modService);

    // Core commands
    registerInitCommands(program);
    registerHelpCommand(program);

    // Module commands
    registerAuthCommands(program, authService);
    registermodulecommands(program, uploadService, downloadService);
    registerInstallCommands(program, downloadService, modulesManager, api);
    registerModulesManagerCommands(program, modulesManager);
    registerPortCommands(program);
    registerPortKillCommands(program);
    registerRegistryCommands(program);
    registerHealthCommands(program);
    registerGatewayCommands(program);
    registerConfigReloadCommands(program);
    registerLoggingCommands(program);

    // Configuration commands
    registerLangcommand(program);
    registerAliascommand(program);
    registerconfigValidateCommand(program);
    registerAnalyticscommand(program);
    registerProfilecommand(program);
    registerPlugincommand(program);

    logger.debug('All commands registered successfully');
  } catch (error) {
    ErrorHandler.handle(error);
  }
}
