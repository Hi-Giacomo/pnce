import { ApiService } from './api.service';
import { OAuth2Service } from './oauth2.service';
import { loginOptions, RegisterOptions, AuthResponse, ApiResponse, user info } from '../types';
import { CliError, ErrorCode } from '../utils';
import { getConfigManager } from '../config/manager';
import * as readline from 'readline';
import { TOKEN, VALIDATION } from '../constants';

/**
 * Authentication
 * User、loginAuthentication
 */
export class AuthService {
  constructor(private api: ApiService) {}

  /**
   * web login(OAuth2)
   * @returns AuthenticationResponse,access_tokenuser info
   */
  async weblogin(): Promise<AuthResponse> {
    const authResponse = await OAuth2Service.weblogin();

    // Token
    const configManager = getConfigManager();
    configManager.setAuth(authResponse.access_token, undefined, TOKEN.DEFAULT_EXPIRE_SECONDS);

    return authResponse;
  }

  /**
   * User
   * @param options - ,Username、email、password
   * @returns AuthenticationResponse,access_tokenuser info
   */
  async register(options: RegisterOptions): Promise<AuthResponse> {
    const username = options.username || (await this.prompt('请输入Username: '));
    const email = options.email || (await this.prompt('请输入email: '));
    const password = options.password || (await this.promptpassword('请输入password: '));

    // Validation
    if (!username || !email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'Username、email andpassword不能为空');
    }

    if (!this.isValidemail(email)) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'email格式不正确');
    }

    if (password.length < 6) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'password长度至少为6位');
    }

    const response = await this.api.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    });

    // Response access_token  user
    if (response.access_token && response.user) {
      // Token
      const configManager = getConfigManager();
      configManager.setAuth(
        response.access_token,
        response.refresh_token,
        TOKEN.DEFAULT_EXPIRE_SECONDS
      );

      return {
        access_token: response.access_token,
        user: response.user
      };
    }

    throw new CliError(ErrorCode.AUTH_REGISTER_FAILED, 'Registration failed');
  }

  /**
   * emailpasswordlogin
   */
  async login(options: loginOptions): Promise<AuthResponse> {
    const email = options.email || (await this.prompt('请输入email: '));
    const password = options.password || (await this.promptpassword('请输入password: '));

    // Validation
    if (!email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'email andpassword不能为空');
    }

    const response = await this.api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    // Response access_token  user
    if (response.access_token && response.user) {
      // Token
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

    throw new CliError(ErrorCode.AUTH_LOGIN_FAILED, 'loginFailed');
  }

  /**
   * Refresh Token
   */
  async refreshToken(): Promise<string> {
    const configManager = getConfigManager();
    const refreshToken = configManager.getRefreshToken();

    if (!refreshToken) {
      throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, '没有有效的Refresh Token');
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

    throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh TokenFailed');
  }

  /**
   * Current user information
   */
  async me(): Promise<user info> {
    const response = await this.api.get<ApiResponse<{ user: user info }>>('/api/auth/me');

    if (!response.success || !response.user) {
      throw new CliError(ErrorCode.AUTH_UNAUTHORIZED, '获取user infoFailed');
    }

    return response.user;
  }

  /**
   * logout
   */
  logout(): void {
    const configManager = getConfigManager();
    configManager.clearAuth();
    console.log('✓ Logged out');
  }

  /**
   * Validationemail
   */
  private isValidemail(email: string): boolean {
    return VALIDATION.EMAIL_REGEX.test(email);
  }

  /**
   * HintUser
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
   * HintUserpassword（）
   */
  private promptpassword(_question: string): Promise<string> {
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
