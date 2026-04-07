/**
 * Mock API 服务
 * 
 * 模拟后端 API 调用，用于前端开发和测试
 */

import type { 
  LoginRequest, 
  LoginApiResponse,
  LoginResponse,
  GetServicesResponse,
  GetServiceDetailResponse,
  StartServiceResponse,
  StopServiceResponse,
  GetDashboardStatsResponse,
  GetRecentActivitiesResponse,
  GetAlertsResponse,
  UserInfo,
  LogoutResponse,
  ServiceStats,
  ServiceMetrics,
} from '../api';

import { 
  mockUsers, 
  createMockLoginResponse, 
  MOCK_LOGIN_DELAY 
} from './users.mock';

import { 
  mockServices, 
  mockServiceStats,
  generateMockServiceMetrics,
  MOCK_SERVICE_DELAY 
} from './services.mock';

import { 
  mockDashboardStats, 
  mockRecentActivities, 
  mockAlerts,
  MOCK_DASHBOARD_DELAY 
} from './dashboard.mock';

/**
 * 模拟延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock 认证服务
 */
export const mockAuthService = {
  /**
   * 模拟登录
   */
  async login(request: LoginRequest): Promise<LoginApiResponse> {
    await delay(MOCK_LOGIN_DELAY);
    
    const user = mockUsers.find(u => u.username === request.username);
    
    if (!user || request.password !== '123456') {
      return {
        code: 401,
        message: '用户名或密码错误',
        data: null as unknown as LoginResponse,
        timestamp: Date.now(),
      };
    }
    
    const response = createMockLoginResponse(request.username);
    
    return {
      code: 200,
      message: '登录成功',
      data: response,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 模拟登出
   */
  async logout(): Promise<{ code: number; message: string; data: LogoutResponse; timestamp: number }> {
    await delay(300);
    
    return {
      code: 200,
      message: '登出成功',
      data: { success: true, message: '登出成功' },
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<{ code: number; message: string; data: UserInfo; timestamp: number }> {
    await delay(200);
    
    // 这里应该从 token 中解析用户信息
    const user = mockUsers[0]; // 默认返回 admin
    
    return {
      code: 200,
      message: '成功',
      data: user,
      timestamp: Date.now(),
    };
  },
};

/**
 * Mock 服务管理服务
 */
export const mockServiceService = {
  /**
   * 获取服务列表
   */
  async getServices(page = 1, pageSize = 10): Promise<GetServicesResponse> {
    await delay(MOCK_SERVICE_DELAY);
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = mockServices.slice(start, end);
    
    return {
      code: 200,
      message: '成功',
      data: {
        list,
        total: mockServices.length,
        page,
        pageSize,
        totalPages: Math.ceil(mockServices.length / pageSize),
      },
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取服务详情
   */
  async getServiceDetail(id: string): Promise<GetServiceDetailResponse> {
    await delay(MOCK_SERVICE_DELAY);
    
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return {
        code: 404,
        message: '服务不存在',
        data: null as unknown as typeof mockServices[0],
        timestamp: Date.now(),
      };
    }
    
    return {
      code: 200,
      message: '成功',
      data: service,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 启动服务
   */
  async startService(id: string): Promise<StartServiceResponse> {
    await delay(MOCK_SERVICE_DELAY);
    
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return {
        code: 404,
        message: '服务不存在',
        data: null as unknown as typeof mockServices[0],
        timestamp: Date.now(),
      };
    }
    
    // 更新服务状态
    service.status = 'running';
    service.cpu = Math.floor(Math.random() * 50) + 20;
    service.memory = Math.floor(Math.random() * 200) + 100;
    service.pid = Math.floor(Math.random() * 10000) + 10000;
    service.startedAt = new Date().toISOString();
    service.lastHeartbeat = new Date().toISOString();
    
    return {
      code: 200,
      message: '服务启动成功',
      data: service,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 停止服务
   */
  async stopService(id: string): Promise<StopServiceResponse> {
    await delay(MOCK_SERVICE_DELAY);
    
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return {
        code: 404,
        message: '服务不存在',
        data: null as unknown as typeof mockServices[0],
        timestamp: Date.now(),
      };
    }
    
    // 更新服务状态
    service.status = 'stopped';
    service.cpu = 0;
    service.memory = 0;
    service.pid = undefined;
    service.startedAt = undefined;
    
    return {
      code: 200,
      message: '服务停止成功',
      data: service,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取服务统计
   */
  async getServiceStats(): Promise<{ code: number; message: string; data: ServiceStats; timestamp: number }> {
    await delay(MOCK_SERVICE_DELAY);
    
    return {
      code: 200,
      message: '成功',
      data: mockServiceStats,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取服务监控数据
   */
  async getServiceMetrics(id: string): Promise<{ code: number; message: string; data: ServiceMetrics; timestamp: number }> {
    await delay(MOCK_SERVICE_DELAY);
    
    const metrics = generateMockServiceMetrics(id);
    
    return {
      code: 200,
      message: '成功',
      data: metrics,
      timestamp: Date.now(),
    };
  },
};

/**
 * Mock 仪表板服务
 */
export const mockDashboardService = {
  /**
   * 获取仪表板统计数据
   */
  async getStats(): Promise<GetDashboardStatsResponse> {
    await delay(MOCK_DASHBOARD_DELAY);
    
    return {
      code: 200,
      message: '成功',
      data: mockDashboardStats,
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取最近活动
   */
  async getRecentActivities(limit = 10): Promise<GetRecentActivitiesResponse> {
    await delay(MOCK_DASHBOARD_DELAY);
    
    return {
      code: 200,
      message: '成功',
      data: mockRecentActivities.slice(0, limit),
      timestamp: Date.now(),
    };
  },
  
  /**
   * 获取告警列表
   */
  async getAlerts(page = 1, pageSize = 10): Promise<GetAlertsResponse> {
    await delay(MOCK_DASHBOARD_DELAY);
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = mockAlerts.slice(start, end);
    const unreadCount = mockAlerts.filter(a => !a.isRead).length;
    
    return {
      code: 200,
      message: '成功',
      data: {
        list,
        total: mockAlerts.length,
        unreadCount,
      },
      timestamp: Date.now(),
    };
  },
  
  /**
   * 标记告警为已读
   */
  async markAlertAsRead(id: string): Promise<{ code: number; message: string; data: { success: boolean; message: string }; timestamp: number }> {
    await delay(300);
    
    const alert = mockAlerts.find(a => a.id === id);
    
    if (alert) {
      alert.isRead = true;
    }
    
    return {
      code: 200,
      message: '告警已标记为已读',
      data: { success: true, message: '告警已标记为已读' },
      timestamp: Date.now(),
    };
  },
};

/**
 * 统一的 Mock API 导出
 */
export const mockApi = {
  auth: mockAuthService,
  service: mockServiceService,
  dashboard: mockDashboardService,
};
