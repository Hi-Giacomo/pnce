import { Command } from 'commander';
import { ModuleService } from '../services/module.service';
import { ModulesManagerService } from '../services/modules-manager.service';
import { ApiService } from '../services/api.service';
/**
 * 注册安装相关命令
 */
export declare function registerInstallCommands(program: Command, moduleService: ModuleService, modulesManager: ModulesManagerService, api: ApiService): void;
//# sourceMappingURL=install.commands.d.ts.map