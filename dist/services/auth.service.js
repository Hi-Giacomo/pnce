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
exports.AuthService = void 0;
const oauth2_service_1 = require("./oauth2.service");
const readline = __importStar(require("readline"));
class AuthService {
    constructor(api) {
        this.api = api;
    }
    async webLogin() {
        return await oauth2_service_1.OAuth2Service.webLogin();
    }
    async register(options) {
        const username = options.username || await this.prompt('请输入用户名: ');
        const email = options.email || await this.prompt('请输入邮箱: ');
        const password = options.password || await this.promptPassword('请输入密码: ');
        const response = await this.api.post('/api/auth/register', {
            username,
            email,
            password
        });
        // 响应直接包含 access_token 和 user
        if (response.access_token) {
            return {
                access_token: response.access_token,
                user: response.user || { email }
            };
        }
        throw new Error('注册失败');
    }
    async login(options) {
        const email = options.email || await this.prompt('请输入邮箱: ');
        const password = options.password || await this.promptPassword('请输入密码: ');
        const response = await this.api.post('/api/auth/login', {
            email,
            password
        });
        // 响应直接包含 access_token 和 user
        if (response.access_token) {
            return {
                access_token: response.access_token,
                user: response.user || { email }
            };
        }
        throw new Error('登录失败');
    }
    prompt(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }
    promptPassword(_question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            let password = '';
            const onData = (char) => {
                const str = char.toString();
                switch (str) {
                    case '\n':
                    case '\r':
                    case '\u0004':
                        process.stdin.setRawMode(false);
                        process.stdin.pause();
                        process.stdin.removeListener('data', onData);
                        rl.close();
                        console.log();
                        resolve(password);
                        break;
                    case '\u0003':
                        process.exit();
                        break;
                    default:
                        password += str;
                        break;
                }
            };
            process.stdin.on('data', onData);
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map