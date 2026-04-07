/**
 * Mock 数据 - 服务管理
 */

import type { ServiceInfo, ServiceStats, ServiceMetrics } from '../api';

/**
 * Mock 服务列表
 */
export const mockServices: ServiceInfo[] = [
  {
    id: '1',
    name: '用户服务',
    description: '处理用户认证和授权',
    port: 3001,
    status: 'running',
    cpu: 45,
    memory: 128,
    pid: 12345,
    startedAt: '2024-04-01T08:00:00Z',
    lastHeartbeat: new Date().toISOString(),
    version: '1.2.0',
    tags: ['core', 'auth'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '订单服务',
    description: '处理订单相关业务',
    port: 3002,
    status: 'running',
    cpu: 62,
    memory: 256,
    pid: 12346,
    startedAt: '2024-04-01T08:05:00Z',
    lastHeartbeat: new Date().toISOString(),
    version: '1.1.5',
    tags: ['business', 'order'],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '支付服务',
    description: '处理支付和退款',
    port: 3003,
    status: 'stopped',
    cpu: 0,
    memory: 0,
    pid: undefined,
    startedAt: undefined,
    lastHeartbeat: '2024-04-07T15:30:00Z',
    version: '1.0.8',
    tags: ['business', 'payment'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: '消息服务',
    description: '处理消息推送和通知',
    port: 3004,
    status: 'running',
    cpu: 28,
    memory: 96,
    pid: 12348,
    startedAt: '2024-04-01T08:10:00Z',
    lastHeartbeat: new Date().toISOString(),
    version: '1.3.2',
    tags: ['notification'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: '文件服务',
    description: '处理文件上传和存储',
    port: 3005,
    status: 'error',
    cpu: 0,
    memory: 0,
    pid: undefined,
    startedAt: undefined,
    lastHeartbeat: '2024-04-07T10:00:00Z',
    version: '1.0.3',
    tags: ['storage'],
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock 服务统计数据
 */
export const mockServiceStats: ServiceStats = {
  total: 24,
  running: 18,
  stopped: 4,
  error: 2,
  totalCpu: 450,
  totalMemory: 2048,
  avgCpu: 18.75,
  avgMemory: 85.33,
};

/**
 * 生成 Mock 服务监控数据
 */
export function generateMockServiceMetrics(serviceId: string): ServiceMetrics {
  const now = new Date();
  const dataPoints = [];
  
  // 生成过去 24 小时的数据点（每小时一个）
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    dataPoints.push({
      timestamp: timestamp.toISOString(),
      cpu: Math.floor(Math.random() * 60) + 20,
      memory: Math.floor(Math.random() * 200) + 100,
      requests: Math.floor(Math.random() * 5000) + 1000,
      errors: Math.floor(Math.random() * 50),
      responseTime: Math.floor(Math.random() * 100) + 20,
    });
  }
  
  return {
    serviceId,
    timeRange: '24h',
    dataPoints,
  };
}

/**
 * 模拟延迟
 */
export const MOCK_SERVICE_DELAY = 500; // ms
