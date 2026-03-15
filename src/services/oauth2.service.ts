import * as http from 'http';
import * as crypto from 'crypto';
import * as url from 'url';
import { getConfigManager } from '../config/manager';
import { AuthResponse } from '../types';
import { OAUTH2_CONFIG } from '../config/default.config';

export class OAuth2Service {
  private static readonly CLIENT_ID = OAUTH2_CONFIG.CLIENT_ID;
  private static readonly REDIRECT_PORT = OAUTH2_CONFIG.REDIRECT_PORT;
  private static readonly AUTH_TIMEOUT = OAUTH2_CONFIG.AUTH_TIMEOUT;

  static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  static generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  static generateState(): string {
    return crypto.randomBytes(16).toString('base64url');
  }

  static async webLogin(): Promise<AuthResponse> {
    const config = getConfigManager().getConfig();
    // const registryUrl = config.apiServer;

    //  PKCE
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();
    const redirectUri = `http://localhost:${this.REDIRECT_PORT}/callback`;

    // authorization URL -  oauthEndpoint authorization
    const authUrl = new URL(`${config.oauthEndpoint}`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', OAUTH2_CONFIG.SCOPE);

    console.log('\nProcessingOpenauthorization...');
    console.log(`authorization URL: ${authUrl.toString()}`);
    console.log('Open，Please URL\n');

    //
    await this.openBrowser(authUrl.toString());

    // Local
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url!, true);
        const query = parsedUrl.query;

        // Validation state
        if (query.state !== state) {
          this.sendErrorResponse(res, 400, 'Invalid state parameter');
          reject(new Error('State Validationfailed'));
          return;
        }

        // Yes/NoError
        if (query.error) {
          this.sendErrorResponse(res, 400, `authorizationfailed: ${query.error}`);
          reject(new Error(query.error as string));
          return;
        }

        //  authorization code（，Yes accessToken  user）
        const code = query.code as string;
        if (!code) {
          this.sendErrorResponse(res, 400, 'Missing authorization code');
          reject(new Error('authorization'));
          return;
        }

        // Data（authorizationComplete token ）
        try {
          const data = JSON.parse(Buffer.from(code, 'base64').toString());
          const accessToken = data.accessToken;
          const user = data.user;

          if (!accessToken) {
            this.sendErrorResponse(res, 400, 'Missing access token in response');
            reject(new Error('CallbackDataFormatError'));
            return;
          }

          // authorizationSuccess
          this.sendSuccessResponse(res, user?.username || user?.email || 'User');
          resolve({
            access_token: accessToken,
            user: user,
          });
        } catch (error) {
          this.sendErrorResponse(res, 400, 'Invalid authorization code format');
          reject(new Error('authorizationFormatError'));
        } finally {
          server.close();
        }
      });

      server.listen(this.REDIRECT_PORT, () => {
        console.log(`LocalserviceRun http://localhost:${this.REDIRECT_PORT}`);
        console.log('AwaitauthorizationComplete...\n');
      });

      //
      setTimeout(() => {
        server.close();
        reject(new Error('authorizationTimeout，Please try again'));
      }, this.AUTH_TIMEOUT);
    });
  }

  private static async exchangeToken(
    registryUrl: string,
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<AuthResponse> {
    const axios = (await import('axios')).default;

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

  private static async openBrowser(url: string): Promise<void> {
    const { exec } = await import('child_process');
    const platform = process.platform;

    let command: string;
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

    return new Promise<void>((resolve) => {
      exec(command, (error) => {
        if (error) {
          console.warn('Open，Please URL');
        }
        resolve();
      });
    });
  }

  private static sendSuccessResponse(res: http.ServerResponse, username: string): void {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>authorizationSuccess</title>
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
          <h1>authorizationSuccess</h1>
          <p>User <strong>${username}</strong> Successlogin</p>
          <p class="close-hint">CloseWindowReturn CLI</p>
        </div>
      </body>
      </html>
    `);
  }

  private static sendErrorResponse(
    res: http.ServerResponse,
    statusCode: number,
    message: string
  ): void {
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>authorizationfailed</title>
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
          <h1>authorizationfailed</h1>
          <p>${message}</p>
        </div>
      </body>
      </html>
    `);
  }
}
