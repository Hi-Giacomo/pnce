import { ApiService } from './api.service';
import { OAuth2Service } from './oauth2.service';
import { LoginOptions, RegisterOptions, AuthResponse, ApiResponse, UserInfo } from '../types';
import { CliError, ErrorCode } from '../utils';
import { getConfigManager } from '../config/manager';
import * as readline from 'readline';
import { TOKEN, VALIDATION } from '../constants';

/**
 * AuthService
 * User registration and login authentication
 */
export class AuthService {
  constructor(private api: ApiService) {}

  /**
   * Web login (OAuth2)
   * @returns Auth Response with access token and UserInfo
   */
  async webLogin(): Promise<AuthResponse> {
    const authResponse = await OAuth2Service.webLogin();

    // Save token
    const configManager = getConfigManager();
    configManager.setAuth(authResponse.access_token, undefined, TOKEN.DEFAULT_EXPIRE_SECONDS);

    return authResponse;
  }

  /**
   * Register new user
   * @param options - Registration options including username, email, password
   * @returns Auth Response with access token and UserInfo
   */
  async register(options: RegisterOptions): Promise<AuthResponse> {
    const username = options.username || (await this.prompt('Please enter username: '));
    const email = options.email || (await this.prompt('Please enter email: '));
    const password = options.password || (await this.promptPassword('Please enter password: '));

    // Validate input
    if (!username || !email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'Username, email and password cannot be empty');
    }

    if (!this.isValidEmail(email)) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'Email format is incorrect');
    }

    if (password.length < 6) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'Password must be at least 6 characters');
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
        user: response.user,
      };
    }

    throw new CliError(ErrorCode.AUTH_REGISTER_FAILED, 'Registration failed');
  }

  /**
   * emailpasswordlogin
   */
  async login(options: LoginOptions): Promise<AuthResponse> {
    const email = options.email || (await this.prompt('Please enter email: '));
    const password = options.password || (await this.promptPassword('Please enter password: '));

    // Validation
    if (!email || !password) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'Email and passwordEmpty');
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

    throw new CliError(ErrorCode.AUTH_LOGIN_FAILED, 'Login failed');
  }

  /**
   * Refresh Token
   */
  async refreshToken(): Promise<string> {
    const configManager = getConfigManager();
    const refreshToken = configManager.getRefreshToken();

    if (!refreshToken) {
      throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, 'validRefresh Token');
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

    throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh token failed');
  }

  /**
   * Current UserInformation
   */
  async me(): Promise<UserInfo> {
    const response = await this.api.get<ApiResponse<{ user: UserInfo }>>('/api/auth/me');

    if (!response.success || !response.user) {
      throw new CliError(ErrorCode.AUTH_UNAUTHORIZED, 'GetUserInfofailed');
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
  private isValidEmail(email: string): boolean {
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
