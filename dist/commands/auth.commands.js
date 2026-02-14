"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommands = registerAuthCommands;
const config_service_1 = require("../services/config.service");
/**
 * 注册认证相关命令
 */
function registerAuthCommands(program, authService) {
    // 注册命令
    program
        .command('register')
        .description('注册新用户')
        .option('-u, --username <username>', '用户名')
        .option('-e, --email <email>', '邮箱')
        .option('-p, --password <password>', '密码')
        .action(async (options) => {
        try {
            const response = await authService.register(options);
            config_service_1.ConfigService.updateConfig({ authToken: response.access_token });
            console.log(`✓ 注册成功! 用户: ${response.user.username || response.user.email}`);
        }
        catch (error) {
            console.error('注册失败:', error.response?.data?.message || error.message);
            process.exit(1);
        }
    });
    // 登录命令
    program
        .command('login')
        .description('登录到注册中心（自动打开浏览器进行授权）')
        .option('-e, --email <email>', '邮箱（可选，用于传统登录方式）')
        .option('-p, --password <password>', '密码（可选，用于传统登录方式）')
        .action(async (options) => {
        try {
            let response;
            // 如果提供了邮箱和密码，使用传统登录方式
            if (options.email && options.password) {
                response = await authService.login(options);
            }
            else {
                // 默认使用网页授权登录
                response = await authService.webLogin();
            }
            config_service_1.ConfigService.updateConfig({ authToken: response.access_token });
            console.log(`✓ 登录成功! 用户: ${response.user.username || response.user.email}`);
            console.log('');
            console.log('💡 提示: 您现在可以上传模块了，使用命令: npm run cli upload');
            process.exit(0);
        }
        catch (error) {
            console.error('登录失败:', error.response?.data?.message || error.message);
            process.exit(1);
        }
    });
    // 登出命令
    program
        .command('logout')
        .description('登出')
        .action(() => {
        config_service_1.ConfigService.updateConfig({ authToken: '' });
        console.log('✓ 已登出');
    });
}
//# sourceMappingURL=auth.commands.js.map