"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPortCommands = registerPortCommands;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
/**
 * 注册端口管理相关命令
 */
function registerPortCommands(program) {
    // 端口管理命令
    program
        .command('ports')
        .description('端口管理（查看、清除端口缓存）')
        .option('-c, --clear', '清除端口缓存')
        .option('-s, --show', '显示端口分配信息')
        .action(async (options) => {
        try {
            const portCachePath = path.join(process.env.INIT_CWD || process.cwd(), '.module-port-cache.json');
            // 清除端口缓存
            if (options.clear) {
                if (fs.existsSync(portCachePath)) {
                    fs.removeSync(portCachePath);
                    console.log('✓ 端口缓存已清除');
                }
                else {
                    console.log('端口缓存文件不存在');
                }
                return;
            }
            // 显示端口分配信息（默认行为）
            if (fs.existsSync(portCachePath)) {
                const portCache = fs.readJsonSync(portCachePath);
                console.log('\n📊 端口分配信息：');
                console.log('─'.repeat(40));
                Object.entries(portCache).forEach(([name, port]) => {
                    console.log(`  ${name.padEnd(20)} -> ${port}`);
                });
                console.log('─'.repeat(40));
                console.log(`  缓存文件: ${portCachePath}\n`);
            }
            else {
                console.log('端口缓存文件不存在');
                console.log('提示: 运行 npm run dev 后会自动创建缓存文件');
            }
        }
        catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=port.commands.js.map