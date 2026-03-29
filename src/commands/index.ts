import { Command } from 'commander';
import { ApiService } from '../services/api.service';
import { ModuleService } from '../services/module.service';
import { ModuleUploadService } from '../services/module-upload.service';
import { ModuleDownloadService } from '../services/module-download.service';
import { AuthService } from '../services/auth.service';
import { getLogger, initLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

// Commands
import { registerAuthCommands } from './auth.commands';
import { registermodulecommands } from './module.commands';
import { registerInstallCommands } from './install.commands';
import { registerInitCommands } from './init.commands';
import { registerPortCommands } from './port.commands';
import { register as registerLangcommand } from './lang';
import { register as registerAliascommand } from './alias';
import { register as registerconfigValidateCommand } from './config-validate';
import { registerHelpCommand } from './help.commands';
import { exampleCommand } from './example';

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
    const downloadService = new ModuleDownloadService(api, logger);
    const uploadService = new ModuleUploadService(api, logger);
    const modService = new ModuleService(api);
    const authService = new AuthService(api);

    // Core commands
    registerInitCommands(program);
    registerHelpCommand(program);
    exampleCommand(program);

    // Module commands
    registerAuthCommands(program, authService);
    registermodulecommands(program, uploadService, downloadService);
    registerInstallCommands(program, downloadService, api);
    registerPortCommands(program);

    // Configuration commands
    registerLangcommand(program);
    registerAliascommand(program);
    registerconfigValidateCommand(program);

    logger.debug('All commands registered successfully');
  } catch (error) {
    ErrorHandler.handle(error);
  }
}
