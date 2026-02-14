import { ApiService } from './api.service';
import { LoginOptions, RegisterOptions, AuthResponse } from '../types';
export declare class AuthService {
    private api;
    constructor(api: ApiService);
    webLogin(): Promise<AuthResponse>;
    register(options: RegisterOptions): Promise<AuthResponse>;
    login(options: LoginOptions): Promise<AuthResponse>;
    private prompt;
    private promptPassword;
}
//# sourceMappingURL=auth.service.d.ts.map