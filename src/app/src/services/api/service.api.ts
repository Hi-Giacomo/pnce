import type { ApiResponse, PaginationParams, PaginatedResponse } from './types';

/**
 * 服务状态类型
 */
export type ServiceStatus = 'running' | 'stopped' | 'error' | 'starting' | 'stopping';

/**
 * 服务信息
 */
export interface ServiceInfo {
  /** 服务 ID */
  id: string;
  /** 服务名称 */
  name: string;
  /** 服务描述 */
  description?: string;
  /** 服务端口 */
  port: number;
  /** 服务状态 */
  status: ServiceStatus;
  /** CPU 使用率（%） */
  cpu: number;
  /** 内存使用（MB） */
  memory: number;
  /** 进程 ID */
  pid?: number;
  /** 启动时间 */
  startedAt?: string;
  /** 最后心跳时间 */
  lastHeartbeat?: string;
  /** 版本 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建服务请求
 */
export interface CreateServiceRequest {
  /** 服务名称 */
  name: string;
  /** 服务描述 */
  description?: string;
  /** 服务端口 */
  port: number;
  /** 版本 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 环境变量 */
  env?: Record<string, string>;
}

/**
 * 更新服务请求
 */
export interface UpdateServiceRequest {
  /** 服务名称 */
  name?: string;
  /** 服务描述 */
  description?: string;
  /** 版本 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 环境变量 */
  env?: Record<string, string>;
}

/**
 * 服务查询参数
 */
export interface ServiceQueryParams extends PaginationParams {
  /** 服务状态 */
  status?: ServiceStatus;
  /** 标签过滤 */
  tag?: string;
}

/**
 * 服务统计信息
 */
export interface ServiceStats {
  /** 总服务数 */
  total: number;
  /** 运行中数量 */
  running: number;
  /** 已停止数量 */
  stopped: number;
  /** 错误数量 */
  error: number;
  /** 总 CPU 使用率 */
  totalCpu: number;
  /** 总内存使用（MB） */
  totalMemory: number;
  /** 平均 CPU 使用率 */
  avgCpu: number;
  /** 平均内存使用（MB） */
  avgMemory: number;
}

/**
 * 服务监控数据点
 */
export interface ServiceMetricPoint {
  /** 时间戳 */
  timestamp: string;
  /** CPU 使用率（%） */
  cpu: number;
  /** 内存使用（MB） */
  memory: number;
  /** 请求数 */
  requests: number;
  /** 错误数 */
  errors: number;
  /** 响应时间（ms） */
  responseTime: number;
}

/**
 * 服务监控数据
 */
export interface ServiceMetrics {
  /** 服务 ID */
  serviceId: string;
  /** 时间范围 */
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  /** 数据点列表 */
  dataPoints: ServiceMetricPoint[];
}

/**
 * 服务日志条目
 */
export interface ServiceLogEntry {
  /** 日志 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** 日志消息 */
  message: string;
  /** 模块名称 */
  module?: string;
  /** 额外数据 */
  meta?: Record<string, unknown>;
}

/**
 * 服务日志查询参数
 */
export interface ServiceLogQueryParams {
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 搜索关键词 */
  keyword?: string;
  /** 限制条数 */
  limit?: number;
}

/**
 * 获取服务列表响应
 */
export type GetServicesResponse = ApiResponse<PaginatedResponse<ServiceInfo>>;

/**
 * 获取服务详情响应
 */
export type GetServiceDetailResponse = ApiResponse<ServiceInfo>;

/**
 * 创建服务响应
 */
export type CreateServiceResponse = ApiResponse<ServiceInfo>;

/**
 * 更新服务响应
 */
export type UpdateServiceResponse = ApiResponse<ServiceInfo>;

/**
 * 删除服务响应
 */
export type DeleteServiceResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 启动服务响应
 */
export type StartServiceResponse = ApiResponse<ServiceInfo>;

/**
 * 停止服务响应
 */
export type StopServiceResponse = ApiResponse<ServiceInfo>;

/**
 * 重启服务响应
 */
export type RestartServiceResponse = ApiResponse<ServiceInfo>;

/**
 * 获取服务统计响应
 */
export type GetServiceStatsResponse = ApiResponse<ServiceStats>;

/**
 * 获取服务监控数据响应
 */
export type GetServiceMetricsResponse = ApiResponse<ServiceMetrics>;

/**
 * 获取服务日志响应
 */
export type GetServiceLogsResponse = ApiResponse<ServiceLogEntry[]>;
