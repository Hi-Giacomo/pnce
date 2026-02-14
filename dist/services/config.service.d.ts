import { Config } from '../types';
export declare class ConfigService {
    private static configPath;
    static getConfig(): Config;
    static saveConfig(config: Config): void;
    static updateConfig(updates: Partial<Config>): Config;
}
//# sourceMappingURL=config.service.d.ts.map