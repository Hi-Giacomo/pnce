import type { ApiResponse } from './types';

/**
 * 系统配置项
 */
export interface SystemConfig {
  /** 配置 ID */
  id: string;
  /** 配置键 */
  key: string;
  /** 配置值 */
  value: string | number | boolean | object;
  /** 配置描述 */
  description?: string;
  /** 配置类型 */
  type: 'string' | 'number' | 'boolean' | 'json';
  /** 配置分组 */
  group: string;
  /** 是否可编辑 */
  editable: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  /** 系统名称 */
  name: string;
  /** 系统版本 */
  version: string;
  /** Node.js 版本 */
  nodeVersion: string;
  /** 操作系统 */
  os: string;
  /** 运行时长（秒） */
  uptime: number;
  /** 启动时间 */
  startTime: string;
  /** 环境 */
  environment: 'development' | 'production' | 'test';
}

/**
 * 系统资源使用情况
 */
export interface SystemResourceUsage {
  /** CPU 使用率（%） */
  cpuUsage: number;
  /** 内存使用（MB） */
  memoryUsed: number;
  /** 内存总量（MB） */
  memoryTotal: number;
  /** 内存使用率（%） */
  memoryUsage: number;
  /** 磁盘使用（GB） */
  diskUsed: number;
  /** 磁盘总量（GB） */
  diskTotal: number;
  /** 磁盘使用率（%） */
  diskUsage: number;
  /** 网络接收（MB） */
  networkReceived: number;
  /** 网络发送（MB） */
  networkSent: number;
}

/**
 * 更新系统配置请求
 */
export interface UpdateSystemConfigRequest {
  /** 配置值 */
  value: string | number | boolean | object;
}

/**
 * 批量更新配置请求
 */
export interface BatchUpdateConfigRequest {
  /** 配置列表 */
  configs: Array<{
    /** 配置键 */
    key: string;
    /** 配置值 */
    value: string | number | boolean | object;
  }>;
}

/**
 * 操作日志条目
 */
export interface OperationLog {
  /** 日志 ID */
  id: string;
  /** 操作用户 ID */
  userId: string;
  /** 操作用户名 */
  username: string;
  /** 操作类型 */
  action: string;
  /** 操作模块 */
  module: string;
  /** 操作描述 */
  description: string;
  /** IP 地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求参数 */
  requestData?: Record<string, unknown>;
  /** 响应数据 */
  responseData?: Record<string, unknown>;
  /** 状态码 */
  statusCode: number;
  /** 执行时间（ms） */
  executionTime: number;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams {
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 用户 ID */
  userId?: string;
  /** 操作模块 */
  module?: string;
  /** 操作类型 */
  action?: string;
  /** 状态码 */
  statusCode?: number;
  /** 搜索关键词 */
  keyword?: string;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  /** 是否启用邮件通知 */
  emailEnabled: boolean;
  /** 邮件接收地址 */
  emailRecipients: string[];
  /** 是否启用短信通知 */
  smsEnabled: boolean;
  /** 是否启用 Webhook 通知 */
  webhookEnabled: boolean;
  /** Webhook URL */
  webhookUrl?: string;
  /** 通知事件 */
  events: string[];
}

/**
 * 获取系统配置列表响应
 */
export type GetSystemConfigsResponse = ApiResponse<SystemConfig[]>;

/**
 * 获取单个配置响应
 */
export type GetSystemConfigResponse = ApiResponse<SystemConfig>;

/**
 * 更新配置响应
 */
export type UpdateSystemConfigResponse = ApiResponse<SystemConfig>;

/**
 * 批量更新配置响应
 */
export type BatchUpdateConfigResponse = ApiResponse<{ success: boolean; updated: number }>;

/**
 * 获取系统信息响应
 */
export type GetSystemInfoResponse = ApiResponse<SystemInfo>;

/**
 * 获取系统资源使用情况响应
 */
export type GetSystemResourceUsageResponse = ApiResponse<SystemResourceUsage>;

/**
 * 获取操作日志响应
 */
export type GetOperationLogsResponse = ApiResponse<{
  list: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
}>;

/**
 * 获取通知设置响应
 */
export type GetNotificationSettingsResponse = ApiResponse<NotificationSettings>;

/**
 * 更新通知设置响应
 */
export type UpdateNotificationSettingsResponse = ApiResponse<NotificationSettings>;
