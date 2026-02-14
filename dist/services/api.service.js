"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_service_1 = require("./config.service");
class ApiService {
    constructor() {
        const config = config_service_1.ConfigService.getConfig();
        this.axiosInstance = axios_1.default.create({
            baseURL: config.registry,
        });
    }
    getAuthHeaders() {
        const config = config_service_1.ConfigService.getConfig();
        return config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {};
    }
    async get(url) {
        const response = await this.axiosInstance.get(url, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    async post(url, data, isFormData = false) {
        const headers = this.getAuthHeaders();
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const response = await this.axiosInstance.post(url, data, {
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        return response.data;
    }
    async delete(url) {
        const response = await this.axiosInstance.delete(url, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=api.service.js.map