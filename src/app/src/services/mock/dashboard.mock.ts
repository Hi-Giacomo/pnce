/**
 * Mock 数据 - 仪表板
 */

import type { DashboardStats, RecentActivity, Alert } from '../api';
import { mockServiceStats } from './services.mock';

/**
 * Mock 仪表板统计数据
 */
export const mockDashboardStats: DashboardStats = {
  services: mockServiceStats,
  apiCalls: {
    apiId: 'all',
    totalCalls: 128000,
    successCalls: 125000,
    failedCalls: 3000,
    avgResponseTime: 45.5,
    errorRate: 2.34,
    lastCalledAt: new Date().toISOString(),
  },
  activeUsers: 2845,
  newUsersToday: 23,
  systemUptime: 864000, // 10 days
  alertCount: 5,
};

/**
 * Mock 最近活动
 */
export const mockRecentActivities: RecentActivity[] = [
  {
    id: '1',
    time: '2分钟前',
    action: '服务重启',
    target: '用户服务',
    user: 'admin',
    status: 'success',
    description: '用户服务已成功重启',
  },
  {
    id: '2',
    time: '15分钟前',
    action: '配置更新',
    target: '支付服务',
    user: 'developer',
    status: 'success',
    description: '更新了支付服务的配置参数',
  },
  {
    id: '3',
    time: '1小时前',
    action: '部署失败',
    target: '订单服务',
    user: 'developer',
    status: 'error',
    description: '订单服务 v1.1.6 部署失败',
  },
  {
    id: '4',
    time: '2小时前',
    action: 'API 创建',
    target: '/api/v2/users',
    user: 'admin',
    status: 'success',
    description: '创建了新的用户 API 接口',
  },
  {
    id: '5',
    time: '3小时前',
    action: '权限修改',
    target: '管理员角色',
    user: 'admin',
    status: 'warning',
    description: '修改了管理员角色的权限配置',
  },
  {
    id: '6',
    time: '5小时前',
    action: '服务启动',
    target: '消息服务',
    user: 'admin',
    status: 'success',
    description: '消息服务已成功启动',
  },
];

/**
 * Mock 告警列表
 */
export const mockAlerts: Alert[] = [
  {
    id: '1',
    level: 'error',
    title: '文件服务异常',
    description: '文件服务已经连续 2 小时无响应',
    resourceId: '5',
    resourceType: 'service',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolvedAt: undefined,
  },
  {
    id: '2',
    level: 'warning',
    title: '订单服务高负载',
    description: '订单服务 CPU 使用率超过 80%',
    resourceId: '2',
    resourceType: 'service',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resolvedAt: undefined,
  },
  {
    id: '3',
    level: 'info',
    title: '系统更新可用',
    description: '新版本 v2.1.0 已发布，建议更新',
    resourceId: undefined,
    resourceType: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: undefined,
  },
  {
    id: '4',
    level: 'warning',
    title: '磁盘空间不足',
    description: '系统磁盘使用率超过 85%',
    resourceId: undefined,
    resourceType: 'system',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolvedAt: undefined,
  },
  {
    id: '5',
    level: 'error',
    title: 'API 调用失败率升高',
    description: '过去 1 小时内 API 调用失败率达到 5%',
    resourceId: undefined,
    resourceType: 'api',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    resolvedAt: undefined,
  },
];

/**
 * 模拟延迟
 */
export const MOCK_DASHBOARD_DELAY = 400; // ms
