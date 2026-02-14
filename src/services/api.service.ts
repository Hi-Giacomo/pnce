import axios, { AxiosInstance } from 'axios';
import { ConfigService } from './config.service';
import { ApiResponse, AuthResponse } from '../types';

export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const config = ConfigService.getConfig();
    this.axiosInstance = axios.create({
      baseURL: config.registry,
    });
  }

  private getAuthHeaders() {
    const config = ConfigService.getConfig();
    return config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {};
  }

  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get(url, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async post<T = any>(url: string, data: any, isFormData = false): Promise<ApiResponse<T>> {
    const headers: any = this.getAuthHeaders();
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

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete(url, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}
