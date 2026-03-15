import axios, { AxiosInstance } from 'axios';
import retry from 'axios-retry';
import { ApiResponse } from '../types';
import { getConfigManager } from '../config/manager';
import { CliError, ErrorCode, Logger } from '../utils';
import { HTTP } from '../constants';

/**
 * API
 * HTTPRequestInterface
 */
export class ApiService {
  private axiosInstance: AxiosInstance;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
    const configManager = getConfigManager();
    const config = configManager.getConfig();

    this.axiosInstance = axios.create({
      baseURL: config.apiServer,
    });

    //
    retry(this.axiosInstance, {
      retries: HTTP.RETRY_COUNT,
      retryDelay: (retryCount) => retryCount * HTTP.RETRY_DELAY_MS,
      retryCondition: (error) => {
        // Error5xxError
        return !error.response || error.response.status >= 500;
      },
    });

    // Request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger?.debug('APIRequest', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger?.error('APIRequestError', { error });
        return Promise.reject(error);
      }
    );

    // Response
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
   * Auth
   */
  getAuthHeaders() {
    const config = getConfigManager();
    const token = config.getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  /**
   * APIError
   * @param error - Error
   * @throws CliError - CLIError
   */
  private handleApiError(error: unknown): never {
    if (error && typeof error === 'object' && 'response' in error) {
      const { status, data } = (error as any).response;

      switch (status) {
        case 401:
          throw CliError.unauthorized(data.message || 'authorization，Pleaselogin');
        case 403:
          throw new CliError(ErrorCode.FILE_ACCESS_DENIED, data.message || '');
        case 404:
          throw CliError.moduleNotFound(
            (error as any).config.url?.split('/').pop() || 'Unknownmodule'
          );
        case 429:
          throw new CliError('RATE_LIMIT_EXCEEDED', 'Request，Please', 429);
        default:
          throw new CliError(ErrorCode.SERVER_ERROR, data.message || `serviceError: ${status}`);
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      // RequestResponse - YesStatus
      const errorMsg = 'Network requestfailed，PleasecheckConnection';
      const config = getConfigManager();
      const isOfflineMode = config.get('enableCache') === true;

      if (isOfflineMode) {
        throw new CliError(
          'OFFLINE_MODE',
          `${errorMsg}\nHint：Current，CLI UseCacheMediumData\n，PleasecheckConnectionRetry`,
          -1
        );
      }
      throw CliError.networkError(errorMsg);
    } else {
      // RequestError
      throw new CliError(
        ErrorCode.INVALID_INPUT,
        (error as Error).message || 'RequestConfigureError'
      );
    }
  }

  /**
   * GETRequest
   */
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, {
      headers: this.getAuthHeaders(),
    });

    this.logger?.debug('APIResponse', { url, status: response.status });

    return response.data;
  }

  /**
   * POSTRequest
   * @param url - RequestURL
   * @param data - RequestData
   * @param isFormData - Yes/NoData
   * @returns APIResponseData
   */
  async post<T = unknown>(url: string, data: unknown, isFormData = false): Promise<ApiResponse<T>> {
    const authHeaders = this.getAuthHeaders();
    const headers: Record<string, string> = {};

    // undefinedheaders
    if (authHeaders['authorization']) {
      headers['authorization'] = authHeaders['authorization'];
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    this.logger?.debug('APIResponse', { url, status: response.status });

    return response.data;
  }

  /**
   * DELETERequest
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, {
      headers: this.getAuthHeaders(),
    });

    this.logger?.debug('APIResponse', { url, status: response.status });

    return response.data;
  }

  /**
   * axios()
   * @returns Axios
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
