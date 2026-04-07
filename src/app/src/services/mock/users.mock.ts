/**
 * Mock 数据 - 用户相关
 */

import type { UserInfo, LoginResponse } from '../api';

/**
 * Mock 用户列表
 */
export const mockUsers: UserInfo[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    avatar: '',
    roles: ['admin'],
    permissions: [
      'dashboard:view',
      'service:view', 'service:create', 'service:update', 'service:delete', 'service:control',
      'api:view', 'api:create', 'api:update', 'api:delete',
      'user:view', 'user:create', 'user:update', 'user:delete', 'user:role-manage',
      'setting:view', 'setting:update'
    ],
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'developer',
    email: 'dev@example.com',
    phone: '13800138001',
    avatar: '',
    roles: ['developer'],
    permissions: [
      'dashboard:view',
      'service:view', 'service:create', 'service:update',
      'api:view', 'api:create', 'api:update',
    ],
    createdAt: '2024-01-15T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'viewer',
    email: 'viewer@example.com',
    phone: '13800138002',
    avatar: '',
    roles: ['viewer'],
    permissions: [
      'dashboard:view',
      'service:view',
      'api:view',
    ],
    createdAt: '2024-02-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
];

/**
 * Mock 登录响应
 */
export function createMockLoginResponse(username: string): LoginResponse {
  const user = mockUsers.find(u => u.username === username) || mockUsers[0];
  
  return {
    accessToken: `mock_access_token_${Date.now()}`,
    refreshToken: `mock_refresh_token_${Date.now()}`,
    tokenType: 'Bearer',
    expiresIn: 7200,
    user,
  };
}

/**
 * 模拟登录延迟
 */
export const MOCK_LOGIN_DELAY = 800; // ms
