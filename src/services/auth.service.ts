import { ApiService } from './api.service';
import { OAuth2Service } from './oauth2.service';
import { LoginOptions, RegisterOptions, AuthResponse } from '../types';
import * as readline from 'readline';

export class AuthService {
  constructor(private api: ApiService) {}

  async webLogin(): Promise<AuthResponse> {
    return await OAuth2Service.webLogin();
  }

  async register(options: RegisterOptions): Promise<AuthResponse> {
    const username = options.username || await this.prompt('请输入用户名: ');
    const email = options.email || await this.prompt('请输入邮箱: ');
    const password = options.password || await this.promptPassword('请输入密码: ');

    const response = await this.api.post<AuthResponse>('/api/auth/register', {
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

  async login(options: LoginOptions): Promise<AuthResponse> {
    const email = options.email || await this.prompt('请输入邮箱: ');
    const password = options.password || await this.promptPassword('请输入密码: ');

    const response = await this.api.post<AuthResponse>('/api/auth/login', {
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

  private prompt(question: string): Promise<string> {
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
