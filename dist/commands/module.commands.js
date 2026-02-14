"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModuleCommands = registerModuleCommands;
const config_service_1 = require("../services/config.service");
/**
 * 注册模块管理相关命令
 */
function registerModuleCommands(program, moduleService) {
    // 上传模块命令
    program
        .command('upload')
        .description('上传模块到注册中心（从 package.json 自动读取模块信息）')
        .option('-d, --directory <dir>', '模块目录路径', '.')
        .action(async (options) => {
        try {
            const config = config_service_1.ConfigService.getConfig();
            // 检查是否已登录
            if (!config.authToken) {
                console.error('❌ 错误: 请先登录');
                console.error('   运行: yarn cli login');
                process.exit(1);
            }
            await moduleService.upload(options.directory);
        }
        catch (error) {
            console.error('上传失败:', error.message);
            process.exit(1);
        }
    });
    // 列出所有模块命令
    program
        .command('list')
        .description('列出所有模块')
        .action(async () => {
        try {
            await moduleService.list();
        }
        catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    });
    // 搜索模块命令
    program
        .command('search <query>')
        .description('搜索模块')
        .action(async (query) => {
        try {
            await moduleService.search(query);
        }
        catch (error) {
            console.error('搜索失败:', error.message);
            process.exit(1);
        }
    });
    // 查看模块详情命令
    program
        .command('info <name>')
        .description('查看模块详情')
        .action(async (name) => {
        try {
            await moduleService.info(name);
        }
        catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    });
    // 查看统计信息命令
    program
        .command('stats')
        .description('查看统计信息')
        .action(async () => {
        try {
            await moduleService.getStats();
        }
        catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=module.commands.js.map