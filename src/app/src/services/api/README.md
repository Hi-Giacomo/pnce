# API 服务层

本目录包含微服务管理平台的所有 API 接口类型定义和文档。

## 目录结构

```
src/services/api/
├── types.ts                 # 通用类型定义
├── auth.api.ts             # 认证相关接口类型
├── service.api.ts          # 服务管理接口类型
├── api.api.ts              # API 管理接口类型
├── user.api.ts             # 用户管理接口类型
├── settings.api.ts         # 系统设置接口类型
├── dashboard.api.ts        # 仪表板接口类型
├── index.ts                # 统一导出
└── API_DOCUMENTATION.md    # 详细接口文档
```

## 快速开始

### 1. 导入类型

```typescript
import type { 
  LoginRequest, 
  LoginResponse, 
  ServiceInfo,
  ApiResponse 
} from '@/services/api';
```

### 2. 使用示例

```typescript
import axios from 'axios';
import type { LoginRequest, LoginApiResponse } from '@/services/api';

// 登录
async function login(credentials: LoginRequest): Promise<LoginApiResponse> {
  const response = await axios.post('/api/v1/auth/login', credentials);
  return response.data;
}

// 获取服务列表
async function getServices(page: number, pageSize: number) {
  const response = await axios.get('/api/v1/services', {
    params: { page, pageSize }
  });
  return response.data;
}
```

## 模块说明

### 基础类型 (types.ts)

包含通用的 API 响应类型、分页参数等：

- `ApiResponse<T>` - 标准 API 响应格式
- `PaginationParams` - 分页请求参数
- `PaginatedResponse<T>` - 分页响应数据

### 认证模块 (auth.api.ts)

处理用户认证相关的接口：

- 用户登录/登出
- 令牌刷新
- 获取当前用户信息
- 修改密码

**主要类型**:
- `LoginRequest` / `LoginResponse`
- `UserInfo`
- `RefreshTokenRequest` / `RefreshTokenResponse`

### 服务管理模块 (service.api.ts)

微服务的 CRUD 操作和监控：

- 服务的创建、查询、更新、删除
- 服务的启动、停止、重启
- 服务监控数据采集
- 服务日志查询

**主要类型**:
- `ServiceInfo` - 服务信息
- `ServiceStatus` - 服务状态
- `CreateServiceRequest` / `UpdateServiceRequest`
- `ServiceMetrics` - 服务监控数据
- `ServiceStats` - 服务统计

### API 管理模块 (api.api.ts)

API 接口的管理和监控：

- API 的 CRUD 操作
- API 调用统计
- API 调用日志

**主要类型**:
- `ApiInfo` - API 信息
- `HttpMethod` - HTTP 方法类型
- `CreateApiRequest` / `UpdateApiRequest`
- `ApiCallStats` - API 调用统计
- `ApiCallLog` - API 调用日志

### 用户管理模块 (user.api.ts)

用户和权限管理：

- 用户的 CRUD 操作
- 角色和权限管理
- 用户状态控制

**主要类型**:
- `UserDetail` - 用户详细信息
- `Role` - 角色信息
- `Permission` - 权限信息
- `CreateUserRequest` / `UpdateUserRequest`

### 系统设置模块 (settings.api.ts)

系统配置和监控：

- 系统配置管理
- 系统信息查看
- 资源使用监控
- 操作日志查询
- 通知设置

**主要类型**:
- `SystemConfig` - 系统配置
- `SystemInfo` - 系统信息
- `SystemResourceUsage` - 资源使用情况
- `OperationLog` - 操作日志

### 仪表板模块 (dashboard.api.ts)

仪表板数据展示：

- 统计数据聚合
- 趋势数据分析
- 最近活动记录
- 告警管理

**主要类型**:
- `DashboardStats` - 仪表板统计
- `TrendData` - 趋势数据
- `RecentActivity` - 最近活动
- `Alert` - 告警信息

## 开发规范

### 1. 类型命名规范

- 请求类型：`XxxRequest`
- 响应类型：`XxxResponse`
- API 响应包装：`XxxApiResponse`
- 实体类型：`XxxInfo` 或 `XxxDetail`

### 2. 接口设计原则

- 所有接口使用统一的响应格式
- 使用 RESTful 风格设计 API
- 需要认证的接口必须在请求头携带 Token
- 分页接口统一使用 `page` 和 `pageSize` 参数

### 3. 错误处理

```typescript
try {
  const result = await apiCall();
  if (result.code === 200) {
    // 处理成功逻辑
  } else {
    // 处理业务错误
    console.error(result.message);
  }
} catch (error) {
  // 处理网络错误或异常
  console.error('Request failed:', error);
}
```

## 后端开发参考

后端开发人员请参考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 进行接口开发，确保：

1. ✅ 接口路径符合文档规范
2. ✅ 请求/响应格式与类型定义一致
3. ✅ 状态码使用正确
4. ✅ 错误消息清晰明确
5. ✅ 需要认证的接口已添加鉴权中间件

## 前端开发参考

前端开发人员使用时应：

1. ✅ 从 `@/services/api` 导入所需类型
2. ✅ 使用 TypeScript 类型约束确保类型安全
3. ✅ 处理可能的错误情况
4. ✅ 遵循项目的 API 调用规范

## 示例：创建 API 服务层

```typescript
// services/auth.service.ts
import axios from 'axios';
import type { 
  LoginRequest, 
  LoginApiResponse,
  UserInfo,
  GetCurrentUserInfoResponse 
} from '@/services/api';

const API_BASE = '/api/v1';

export const authService = {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginApiResponse> {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    return response.data;
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo> {
    const response = await axios.get<GetCurrentUserInfoResponse>(
      `${API_BASE}/auth/me`
    );
    
    if (response.data.code !== 200) {
      throw new Error(response.data.message);
    }
    
    return response.data.data;
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await axios.post(`${API_BASE}/auth/logout`);
  }
};
```

## 更新日志

- **2026-04-08**: 初始版本，完成所有核心模块的接口定义

## 联系方式

如有问题或建议，请联系开发团队。
