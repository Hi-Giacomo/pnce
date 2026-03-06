import axios, { AxiosInstance } from 'axios';
import retry from 'axios-retry';
import { ApiResponse } from '../types';
import { getConfigManager } from '../config/manager';
import { CliError, ErrorCode, Logger } from '../utils';
import { HTTP } from '../constants';

/**
 * API服务
 * 提供统一的HTTP请求接口
 */
export class ApiService {
  private axiosInstance: AxiosInstance;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
    const config = getConfigManager();

    this.axiosInstance = axios.create({
      baseURL: config.get('apiServer'),
    });

    // 配置重试机制
    retry(this.axiosInstance, {
      retries: HTTP.RETRY_COUNT,
      retryDelay: retryCount => retryCount * HTTP.RETRY_DELAY_MS,
      retryCondition: (error) => {
        // 只在网络错误或5xx错误时重试
        return !error.response || error.response.status >= 500;
      },
    });

    // 添加请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger?.debug('API请求', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger?.error('API请求错误', { error });
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    const config = getConfigManager();
    const token = config.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * 处理API错误
   * @param error - 错误对象
   * @throws CliError - 统一的CLI错误
   */
  private handleApiError(error: unknown): never {
    if (error && typeof error === 'object' && 'response' in error) {
      const { status, data } = (error as any).response;

      switch (status) {
        case 401:
          throw CliError.unauthorized(data.message || '未授权，请先登录');
        case 403:
          throw new CliError(ErrorCode.FILE_ACCESS_DENIED, data.message || '无权访问');
        case 404:
          throw CliError.moduleNotFound((error as any).config.url?.split('/').pop() || '未知模块');
        case 429:
          throw new CliError('RATE_LIMIT_EXCEEDED', '请求过于频繁，请稍后再试', 429);
        default:
          throw new CliError(
            ErrorCode.SERVER_ERROR,
            data.message || `服务器错误: ${status}`
          );
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      // 请求已发送但没有收到响应
      throw CliError.networkError('网络请求失败，请检查网络连接');
    } else {
      // 请求配置错误
      throw new CliError(ErrorCode.INVALID_INPUT, (error as Error).message || '请求配置错误');
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, {
      headers: this.getAuthHeaders(),
    });

    this.logger?.debug('API响应', { url, status: response.status });

    return response.data;
  }

  /**
   * POST请求
   * @param url - 请求URL
   * @param data - 请求数据
   * @param isFormData - 是否为表单数据
   * @returns API响应数据
   */
  async post<T = unknown>(url: string, data: unknown, isFormData = false): Promise<ApiResponse<T>> {
    const authHeaders = this.getAuthHeaders();
    const headers: Record<string, string> = {};

    // 只添加非undefined的headers
    if (authHeaders['Authorization']) {
      headers['Authorization'] = authHeaders['Authorization'];
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    this.logger?.debug('API响应', { url, status: response.status });

    return response.data;
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, {
      headers: this.getAuthHeaders(),
    });

    this.logger?.debug('API响应', { url, status: response.status });

    return response.data;
  }

  /**
   * 获取axios实例(用于直接使用)
   * @returns Axios实例
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
