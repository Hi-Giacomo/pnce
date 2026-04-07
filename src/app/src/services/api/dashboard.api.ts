import type { ApiResponse } from './types';
import type { ServiceStats } from './service.api';
import type { ApiCallStats } from './api.api';

/**
 * 仪表板统计数据
 */
export interface DashboardStats {
  /** 服务统计 */
  services: ServiceStats;
  /** API 调用统计 */
  apiCalls: ApiCallStats;
  /** 活跃用户数 */
  activeUsers: number;
  /** 今日新增用户 */
  newUsersToday: number;
  /** 系统运行时长（秒） */
  systemUptime: number;
  /** 告警数量 */
  alertCount: number;
}

/**
 * 趋势数据点
 */
export interface TrendDataPoint {
  /** 时间戳 */
  timestamp: string;
  /** 数值 */
  value: number;
  /** 标签 */
  label?: string;
}

/**
 * 趋势数据
 */
export interface TrendData {
  /** 标题 */
  title: string;
  /** 数据类型 */
  type: 'line' | 'bar' | 'area';
  /** 数据点列表 */
  dataPoints: TrendDataPoint[];
  /** 单位 */
  unit?: string;
  /** 时间范围 */
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
}

/**
 * 最近活动项
 */
export interface RecentActivity {
  /** 活动 ID */
  id: string;
  /** 活动时间 */
  time: string;
  /** 操作类型 */
  action: string;
  /** 操作目标 */
  target: string;
  /** 操作用户 */
  user?: string;
  /** 状态 */
  status: 'success' | 'error' | 'warning';
  /** 详细描述 */
  description?: string;
}

/**
 * 告警信息
 */
export interface Alert {
  /** 告警 ID */
  id: string;
  /** 告警级别 */
  level: 'info' | 'warning' | 'error' | 'critical';
  /** 告警标题 */
  title: string;
  /** 告警描述 */
  description: string;
  /** 相关资源 ID */
  resourceId?: string;
  /** 相关资源类型 */
  resourceType?: 'service' | 'api' | 'user' | 'system';
  /** 是否已读 */
  isRead: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 解决时间 */
  resolvedAt?: string;
}

/**
 * 快速操作项
 */
export interface QuickAction {
  /** 操作 ID */
  id: string;
  /** 操作名称 */
  name: string;
  /** 操作描述 */
  description: string;
  /** 操作图标 */
  icon: string;
  /** 操作类型 */
  actionType: 'navigate' | 'modal' | 'confirm';
  /** 目标路径或操作 */
  target: string;
}

/**
 * 获取仪表板统计数据响应
 */
export type GetDashboardStatsResponse = ApiResponse<DashboardStats>;

/**
 * 获取趋势数据响应
 */
export type GetTrendDataResponse = ApiResponse<TrendData>;

/**
 * 获取最近活动响应
 */
export type GetRecentActivitiesResponse = ApiResponse<RecentActivity[]>;

/**
 * 获取告警列表响应
 */
export type GetAlertsResponse = ApiResponse<{
  list: Alert[];
  total: number;
  unreadCount: number;
}>;

/**
 * 标记告警为已读响应
 */
export type MarkAlertAsReadResponse = ApiResponse<{ success: boolean; message: string }>;

/**
 * 获取快速操作列表响应
 */
export type GetQuickActionsResponse = ApiResponse<QuickAction[]>;
