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
exports.ConfigService = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const default_config_1 = require("../config/default.config");
const CONFIG_FILE = default_config_1.CONFIG_FILE_NAME;
class ConfigService {
    static getConfig() {
        if (fs.existsSync(this.configPath)) {
            return fs.readJsonSync(this.configPath);
        }
        return {
            registry: process.env[default_config_1.ENV_KEYS.MODULE_REGISTRY] || default_config_1.DEFAULT_REGISTRY_URL,
            website: process.env[default_config_1.ENV_KEYS.MODULE_REGISTRY_WEBSITE] || default_config_1.DEFAULT_WEBSITE_URL,
            authToken: process.env[default_config_1.ENV_KEYS.MODULE_AUTH_TOKEN] || ''
        };
    }
    static saveConfig(config) {
        fs.writeJsonSync(this.configPath, config, { spaces: 2 });
    }
    static updateConfig(updates) {
        const config = this.getConfig();
        const newConfig = { ...config, ...updates };
        this.saveConfig(newConfig);
        return newConfig;
    }
}
exports.ConfigService = ConfigService;
ConfigService.configPath = path.join(process.cwd(), CONFIG_FILE);
//# sourceMappingURL=config.service.js.map