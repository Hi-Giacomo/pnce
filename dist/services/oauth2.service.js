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
exports.OAuth2Service = void 0;
const http = __importStar(require("http"));
const crypto = __importStar(require("crypto"));
const url = __importStar(require("url"));
const config_service_1 = require("./config.service");
const default_config_1 = require("../config/default.config");
class OAuth2Service {
    static generateCodeVerifier() {
        return crypto.randomBytes(32).toString('base64url');
    }
    static generateCodeChallenge(verifier) {
        return crypto.createHash('sha256').update(verifier).digest('base64url');
    }
    static generateState() {
        return crypto.randomBytes(16).toString('base64url');
    }
    static async webLogin() {
        const config = config_service_1.ConfigService.getConfig();
        const registryUrl = config.registry;
        // 生成 PKCE 参数
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        const state = this.generateState();
        const redirectUri = `http://localhost:${this.REDIRECT_PORT}/callback`;
        // 构建授权 URL - 使用 website 的授权页面
        const websiteUrl = config.website;
        const authUrl = new URL(`${websiteUrl}/authorize`);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', this.CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', default_config_1.OAUTH2_CONFIG.SCOPE);
        console.log('\n正在打开浏览器进行授权...');
        console.log(`授权 URL: ${authUrl.toString()}`);
        console.log('如果浏览器未自动打开，请手动访问上述 URL\n');
        // 打开浏览器
        await this.openBrowser(authUrl.toString());
        // 创建本地服务器接收回调
        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url, true);
                const query = parsedUrl.query;
                // 验证 state
                if (query.state !== state) {
                    this.sendErrorResponse(res, 400, 'Invalid state parameter');
                    reject(new Error('State 验证失败'));
                    return;
                }
                // 检查是否有错误
                if (query.error) {
                    this.sendErrorResponse(res, 400, `授权失败: ${query.error}`);
                    reject(new Error(query.error));
                    return;
                }
                // 获取 authorization code（实际上在新的流程中，这里已经是编码后的 accessToken 和 user）
                const code = query.code;
                if (!code) {
                    this.sendErrorResponse(res, 400, 'Missing authorization code');
                    reject(new Error('缺少授权码'));
                    return;
                }
                // 解析回调中的数据（授权页面已经完成了 token 交换）
                try {
                    const data = JSON.parse(Buffer.from(code, 'base64').toString());
                    const accessToken = data.accessToken;
                    const user = data.user;
                    if (!accessToken) {
                        this.sendErrorResponse(res, 400, 'Missing access token in response');
                        reject(new Error('回调数据格式错误'));
                        return;
                    }
                    // 返回授权成功
                    this.sendSuccessResponse(res, user?.username || user?.email || '用户');
                    resolve({
                        access_token: accessToken,
                        user: user,
                    });
                }
                catch (error) {
                    this.sendErrorResponse(res, 400, 'Invalid authorization code format');
                    reject(new Error('授权码格式错误'));
                }
                finally {
                    server.close();
                }
            });
            server.listen(this.REDIRECT_PORT, () => {
                console.log(`本地服务器运行在 http://localhost:${this.REDIRECT_PORT}`);
                console.log('等待授权完成...\n');
            });
            // 超时处理
            setTimeout(() => {
                server.close();
                reject(new Error('授权超时，请重试'));
            }, this.AUTH_TIMEOUT);
        });
    }
    static async exchangeToken(registryUrl, code, codeVerifier, redirectUri) {
        const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
        const response = await axios.post(`${registryUrl}/api/auth/oauth2/token`, {
            grant_type: 'authorization_code',
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
            client_id: this.CLIENT_ID,
        });
        return {
            access_token: response.data.access_token,
            user: response.data.user,
        };
    }
    static async openBrowser(url) {
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const platform = process.platform;
        let command;
        switch (platform) {
            case 'darwin':
                command = `open "${url}"`;
                break;
            case 'win32':
                command = `start "" "${url}"`;
                break;
            default:
                command = `xdg-open "${url}"`;
                break;
        }
        return new Promise((resolve, reject) => {
            exec(command, (error) => {
                if (error) {
                    console.warn('无法自动打开浏览器，请手动访问上述 URL');
                }
                resolve();
            });
        });
    }
    static sendSuccessResponse(res, username) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>授权成功</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            color: #10b981;
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            margin-bottom: 20px;
          }
          .close-hint {
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>授权成功</h1>
          <p>用户 <strong>${username}</strong> 已成功登录</p>
          <p class="close-hint">您可以关闭此窗口返回 CLI</p>
        </div>
      </body>
      </html>
    `);
    }
    static sendErrorResponse(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>授权失败</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .error-icon {
            color: #ef4444;
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">✗</div>
          <h1>授权失败</h1>
          <p>${message}</p>
        </div>
      </body>
      </html>
    `);
    }
}
exports.OAuth2Service = OAuth2Service;
OAuth2Service.CLIENT_ID = default_config_1.OAUTH2_CONFIG.CLIENT_ID;
OAuth2Service.REDIRECT_PORT = default_config_1.OAUTH2_CONFIG.REDIRECT_PORT;
OAuth2Service.AUTH_TIMEOUT = default_config_1.OAUTH2_CONFIG.AUTH_TIMEOUT;
//# sourceMappingURL=oauth2.service.js.map