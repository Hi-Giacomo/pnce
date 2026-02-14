"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const api_service_1 = require("../services/api.service");
const module_service_1 = require("../services/module.service");
const auth_service_1 = require("../services/auth.service");
const modules_manager_service_1 = require("../services/modules-manager.service");
// 导入命令注册函数
const auth_commands_1 = require("./auth.commands");
const module_commands_1 = require("./module.commands");
const install_commands_1 = require("./install.commands");
const init_commands_1 = require("./init.commands");
const modules_manager_commands_1 = require("./modules-manager.commands");
const port_commands_1 = require("./port.commands");
const registry_commands_1 = require("./registry.commands");
/**
 * 注册所有命令
 */
function registerCommands(program) {
    // 初始化服务
    const api = new api_service_1.ApiService();
    const moduleService = new module_service_1.ModuleService(api);
    const authService = new auth_service_1.AuthService(api);
    const modulesManager = new modules_manager_service_1.ModulesManagerService(api, moduleService);
    // 注册各模块命令
    (0, auth_commands_1.registerAuthCommands)(program, authService);
    (0, module_commands_1.registerModuleCommands)(program, moduleService);
    (0, install_commands_1.registerInstallCommands)(program, moduleService, modulesManager, api);
    (0, init_commands_1.registerInitCommands)(program);
    (0, modules_manager_commands_1.registerModulesManagerCommands)(program, modulesManager);
    (0, port_commands_1.registerPortCommands)(program);
    (0, registry_commands_1.registerRegistryCommands)(program);
}
//# sourceMappingURL=index.js.map