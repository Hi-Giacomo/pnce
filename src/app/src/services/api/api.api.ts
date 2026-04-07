import type { ApiResponse, PaginationParams, PaginatedResponse } from './types';

/**
 * HTTP 方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * API 状态类型
 */
export type ApiStatus = 'active' | 'inactive' | 'deprecated';

/**
 * 认证类型
 */
export type AuthType = 'none' | 'jwt' | 'api_key' | 'oauth2';

/**
 * API 信息
 */
export interface ApiInfo {
  /** API ID */
  id: string;
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: HttpMethod;
  /** API 名称 */
  name: string;
  /** API 描述 */
  description?: string;
  /** API 状态 */
  status: ApiStatus;
  /** 所属服务 ID */
  serviceId: string;
  /** 所属服务名称 */
  serviceName?: string;
  /** 版本 */
  version?: string;
  /** 认证类型 */
  authType: AuthType;
  /** 是否需要认证 */
  requiresAuth: boolean;
  /** 速率限制（请求/分钟） */
  rateLimit?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 请求参数 schema */
  requestSchema?: Record<string, unknown>;
  /** 响应 schema */
  responseSchema?: Record<string, unknown>;
  /** 标签 */
  tags?: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建 API 请求
 */
export interface CreateApiRequest {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: HttpMethod;
  /** API 名称 */
  name: string;
  /** API 描述 */
  description?: string;
  /** 所属服务 ID */
  serviceId: string;
  /** 版本 */
  version?: string;
  /** 认证类型 */
  authType?: AuthType;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 速率限制（请求/分钟） */
  rateLimit?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 标签 */
  tags?: string[];
}

/**
 * 更新 API 请求
 */
export interface UpdateApiRequest {
  /** API 名称 */
  name?: string;
  /** API 描述 */
  description?: string;
  /** API 状态 */
  status?: ApiStatus;
  /** 版本 */
  version?: string;
  /** 认证类型 */
  authType?: AuthType;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 速率限制（请求/分钟） */
  rateLimit?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 标签 */
  tags?: string[];
}

/**
 * API 查询参数
 */
export interface ApiQueryParams extends PaginationParams {
  /** HTTP 方法过滤 */
  method?: HttpMethod;
  /** API 状态过滤 */
  status?: ApiStatus;
  /** 服务 ID 过滤 */
  serviceId?: string;
  /** 标签过滤 */
  tag?: string;
}

/**
 * API 调用统计
 */
export interface ApiCallStats {
  /** API ID */
  apiId: string;
  /** 总调用次数 */
  totalCalls: number;
  /** 成功次数 */
  successCalls: number;
  /** 失败次数 */
  failedCalls: number;
  /** 平均响应时间（ms） */
  avgResponseTime: number;
  /** 错误率（%） */
  errorRate: number;
  /** 最后调用时间 */
  lastCalledAt?: string;
}

/**
 * API 调用记录
 */
export interface ApiCallLog {
  /** 日志 ID */
  id: string;
  /** API ID */
  apiId: string;
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: HttpMethod;
  /** 状态码 */
  statusCode: number;
  /** 响应时间（ms） */
  responseTime: number;
  /** 请求 IP */
  ipAddress: string;
  /** 用户 ID */
  userId?: string;
  /** 时间戳 */
  timestamp: string;
  /** 错误消息 */
  errorMessage?: string;
}

/**
 * 获取 API 列表响应
 */
export type GetApisResponse = ApiResponse<PaginatedResponse<ApiInfo>>;

/**
 * 获取 API 详情响应
 */
export type GetApiDetailResponse = ApiResponse<ApiInfo>;

/**
 * 创建 API 响应
 */
export type CreateApiResponse = ApiResponse<ApiInfo>;

/**
 * 更新 API 响应
 */
export type UpdateApiResponse = ApiResponse<ApiInfo>;

/**
 * 删除 API 响应
 */
export type DeleteApiResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 获取 API 调用统计响应
 */
export type GetApiCallStatsResponse = ApiResponse<ApiCallStats>;

/**
 * 获取 API 调用日志响应
 */
export type GetApiCallLogsResponse = ApiResponse<PaginatedResponse<ApiCallLog>>;
