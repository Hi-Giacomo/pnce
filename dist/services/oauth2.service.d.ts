import { AuthResponse } from '../types';
export declare class OAuth2Service {
    private static readonly CLIENT_ID;
    private static readonly REDIRECT_PORT;
    private static readonly AUTH_TIMEOUT;
    static generateCodeVerifier(): string;
    static generateCodeChallenge(verifier: string): string;
    static generateState(): string;
    static webLogin(): Promise<AuthResponse>;
    private static exchangeToken;
    private static openBrowser;
    private static sendSuccessResponse;
    private static sendErrorResponse;
}
//# sourceMappingURL=oauth2.service.d.ts.map