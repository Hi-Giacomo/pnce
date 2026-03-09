import { ApiService } from './api.service';
import { OAuth2Service } from './oauth2.service';
import { LoginOptions, RegisterOptions, AuthResponse, ApiResponse, UserInfo } from '../types';
import { CliError, ErrorCode } from '../utils';
import { getConfigManager } from '../config/manager';
import * as readline from 'readline';
import { TOKEN, VALIDATION } from '../constants';

/**
 * 认证服务
 * 负责用户注册、登录和认证管理
 */
export class AuthService {
  constructor(private api: ApiService) {}

  /**
   * Web登录(OAuth2)
   * @returns 认证响应,包含access_token和用户信息
   */
  async webLogin(): Promise<AuthResponse> {
    const authResponse = await OAuth2Service.webLogin();

    // 保存Token到配置
    const configManager = getConfigManager();
    configManager.setAuth(authResponse.access_token, undefined, TOKEN.DEFAULT_EXPIRE_SECONDS);

    return authResponse;
  }

  /**
   * 用户注册
   * @param options - 注册选项,包含用户名、邮箱、密码
   * @returns 认证响应,包含access_token和用户信息
   */
  async register(options: RegisterOptions): Promise<AuthResponse> {
    const username = options.username || (await this.prompt('请输入用户名: '));
    const email = options.email || (await this.prompt('请输入邮箱: '));
    const password = options.password || (await this.promptPassword('请输入密码: '));

    // 验证输入
    if (!username || !email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, '用户名、邮箱和密码不能为空');
    }

    if (!this.isValidEmail(email)) {
      throw new CliError(ErrorCode.INVALID_INPUT, '邮箱格式不正确');
    }

    if (password.length < 6) {
      throw new CliError(ErrorCode.INVALID_INPUT, '密码长度至少为6位');
    }

    const response = await this.api.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    });

    // 响应直接包含 access_token 和 user
    if (response.access_token && response.user) {
      // 保存Token到配置
      const configManager = getConfigManager();
      configManager.setAuth(
        response.access_token,
        response.refresh_token,
        TOKEN.DEFAULT_EXPIRE_SECONDS
      );

      return {
        access_token: response.access_token,
        user: response.user,
      };
    }

    throw new CliError(ErrorCode.AUTH_REGISTER_FAILED, '注册失败');
  }

  /**
   * 邮箱密码登录
   */
  async login(options: LoginOptions): Promise<AuthResponse> {
    const email = options.email || (await this.prompt('请输入邮箱: '));
    const password = options.password || (await this.promptPassword('请输入密码: '));

    // 验证输入
    if (!email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, '邮箱和密码不能为空');
    }

    const response = await this.api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    // 响应直接包含 access_token 和 user
    if (response.access_token && response.user) {
      // 保存Token到配置
      const configManager = getConfigManager();
      configManager.setAuth(
        response.access_token,
        response.refresh_token,
        TOKEN.DEFAULT_EXPIRE_SECONDS
      );

      return {
        access_token: response.access_token,
        user: response.user,
      };
    }

    throw new CliError(ErrorCode.AUTH_LOGIN_FAILED, '登录失败');
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<string> {
    const configManager = getConfigManager();
    const refreshToken = configManager.getRefreshToken();

    if (!refreshToken) {
      throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, '没有有效的刷新Token');
    }

    const response = await this.api.post<{ access_token: string; refresh_token: string }>(
      '/api/auth/refresh',
      { refresh_token: refreshToken }
    );

    if (response.access_token) {
      configManager.setAuth(
        response.access_token,
        response.refresh_token,
        TOKEN.DEFAULT_EXPIRE_SECONDS
      );

      return response.access_token;
    }

    throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, '刷新Token失败');
  }

  /**
   * 获取当前用户信息
   */
  async me(): Promise<UserInfo> {
    const response = await this.api.get<ApiResponse<{ user: UserInfo }>>('/api/auth/me');

    if (!response.success || !response.user) {
      throw new CliError(ErrorCode.AUTH_UNAUTHORIZED, '获取用户信息失败');
    }

    return response.user;
  }

  /**
   * 登出
   */
  logout(): void {
    const configManager = getConfigManager();
    configManager.clearAuth();
    console.log('✓ 已登出');
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    return VALIDATION.EMAIL_REGEX.test(email);
  }

  /**
   * 提示用户输入
   */
  private prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  /**
   * 提示用户输入密码（隐藏显示）
   */
  private promptPassword(_question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let password = '';

      const onData = (char: Buffer) => {
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
