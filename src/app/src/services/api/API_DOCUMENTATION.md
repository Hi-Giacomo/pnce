# API 接口文档

本文档定义了微服务管理平台的所有后端 API 接口规范。

## 目录

- [通用说明](#通用说明)
- [认证模块](#认证模块)
- [服务管理模块](#服务管理模块)
- [API 管理模块](#api-管理模块)
- [用户管理模块](#用户管理模块)
- [系统设置模块](#系统设置模块)
- [仪表板模块](#仪表板模块)

---

## 通用说明

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 响应格式

所有 API 响应遵循统一格式：

```typescript
{
  code: number;        // 状态码：200 成功，其他为错误
  message: string;     // 响应消息
  data: any;          // 响应数据
  timestamp: number;   // 时间戳
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或令牌失效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 认证头

需要认证的接口需在请求头中携带：

```
Authorization: Bearer <access_token>
```

---

## 认证模块

### 1. 用户登录

**接口**: `POST /auth/login`

**请求体**:
```typescript
{
  username: string;      // 用户名
  password: string;      // 密码
  rememberMe?: boolean;  // 是否记住我（可选）
}
```

**响应**:
```typescript
{
  code: 200,
  message: "登录成功",
  data: {
    accessToken: string;     // 访问令牌
    refreshToken: string;    // 刷新令牌
    tokenType: "Bearer";     // 令牌类型
    expiresIn: 7200;         // 过期时间（秒）
    user: {
      id: string;
      username: string;
      email: string;
      phone?: string;
      avatar?: string;
      roles: string[];
      permissions: string[];
      createdAt: string;
      lastLoginAt?: string;
    }
  },
  timestamp: number
}
```

---

### 2. 刷新令牌

**接口**: `POST /auth/refresh`

**请求体**:
```typescript
{
  refreshToken: string;  // 刷新令牌
}
```

**响应**:
```typescript
{
  code: 200,
  message: "刷新成功",
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: 7200;
  },
  timestamp: number
}
```

---

### 3. 获取当前用户信息

**接口**: `GET /auth/me`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    avatar?: string;
    roles: string[];
    permissions: string[];
    createdAt: string;
    lastLoginAt?: string;
  },
  timestamp: number
}
```

---

### 4. 修改密码

**接口**: `PUT /auth/password`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  oldPassword: string;       // 旧密码
  newPassword: string;       // 新密码
  confirmPassword: string;   // 确认新密码
}
```

**响应**:
```typescript
{
  code: 200,
  message: "密码修改成功",
  data: {
    success: true;
    message: "密码修改成功";
  },
  timestamp: number
}
```

---

### 5. 用户登出

**接口**: `POST /auth/logout`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "登出成功",
  data: {
    success: true;
    message: "登出成功";
  },
  timestamp: number
}
```

---

## 服务管理模块

### 1. 获取服务列表

**接口**: `GET /services`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=10&status=running&keyword=用户服务
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        name: string;
        description?: string;
        port: number;
        status: "running" | "stopped" | "error" | "starting" | "stopping";
        cpu: number;           // CPU 使用率 %
        memory: number;        // 内存使用 MB
        pid?: number;
        startedAt?: string;
        lastHeartbeat?: string;
        version?: string;
        tags?: string[];
        createdAt: string;
        updatedAt: string;
      }
    ],
    total: 24,
    page: 1,
    pageSize: 10,
    totalPages: 3
  },
  timestamp: number
}
```

---

### 2. 获取服务详情

**接口**: `GET /services/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    // ServiceInfo 对象
  },
  timestamp: number
}
```

---

### 3. 创建服务

**接口**: `POST /services`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  name: string;              // 服务名称
  description?: string;      // 服务描述
  port: number;              // 服务端口
  version?: string;          // 版本
  tags?: string[];           // 标签
  env?: Record<string, string>;  // 环境变量
}
```

**响应**:
```typescript
{
  code: 200,
  message: "服务创建成功",
  data: {
    // ServiceInfo 对象
  },
  timestamp: number
}
```

---

### 4. 更新服务

**接口**: `PUT /services/:id`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  env?: Record<string, string>;
}
```

**响应**:
```typescript
{
  code: 200,
  message: "服务更新成功",
  data: {
    // ServiceInfo 对象
  },
  timestamp: number
}
```

---

### 5. 删除服务

**接口**: `DELETE /services/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "服务删除成功",
  data: {
    success: true;
    message: "服务删除成功";
  },
  timestamp: number
}
```

---

### 6. 启动服务

**接口**: `POST /services/:id/start`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "服务启动成功",
  data: {
    // ServiceInfo 对象（status 变为 running）
  },
  timestamp: number
}
```

---

### 7. 停止服务

**接口**: `POST /services/:id/stop`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "服务停止成功",
  data: {
    // ServiceInfo 对象（status 变为 stopped）
  },
  timestamp: number
}
```

---

### 8. 重启服务

**接口**: `POST /services/:id/restart`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "服务重启成功",
  data: {
    // ServiceInfo 对象
  },
  timestamp: number
}
```

---

### 9. 获取服务统计

**接口**: `GET /services/stats`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    total: 24,
    running: 18,
    stopped: 4,
    error: 2,
    totalCpu: 450,
    totalMemory: 2048,
    avgCpu: 18.75,
    avgMemory: 85.33
  },
  timestamp: number
}
```

---

### 10. 获取服务监控数据

**接口**: `GET /services/:id/metrics`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
timeRange=24h
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    serviceId: string;
    timeRange: "1h" | "6h" | "24h" | "7d" | "30d";
    dataPoints: [
      {
        timestamp: string;
        cpu: number;
        memory: number;
        requests: number;
        errors: number;
        responseTime: number;
      }
    ]
  },
  timestamp: number
}
```

---

### 11. 获取服务日志

**接口**: `GET /services/:id/logs`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
level=error&limit=100&keyword=exception
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      timestamp: string;
      level: "debug" | "info" | "warn" | "error";
      message: string;
      module?: string;
      meta?: Record<string, unknown>;
    }
  ],
  timestamp: number
}
```

---

## API 管理模块

### 1. 获取 API 列表

**接口**: `GET /apis`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=10&method=GET&status=active&serviceId=xxx
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
        name: string;
        description?: string;
        status: "active" | "inactive" | "deprecated";
        serviceId: string;
        serviceName?: string;
        version?: string;
        authType: "none" | "jwt" | "api_key" | "oauth2";
        requiresAuth: boolean;
        rateLimit?: number;
        timeout?: number;
        requestSchema?: Record<string, unknown>;
        responseSchema?: Record<string, unknown>;
        tags?: string[];
        createdAt: string;
        updatedAt: string;
      }
    ],
    total: 50,
    page: 1,
    pageSize: 10,
    totalPages: 5
  },
  timestamp: number
}
```

---

### 2. 获取 API 详情

**接口**: `GET /apis/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    // ApiInfo 对象
  },
  timestamp: number
}
```

---

### 3. 创建 API

**接口**: `POST /apis`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  path: string;              // API 路径
  method: HttpMethod;        // HTTP 方法
  name: string;              // API 名称
  description?: string;      // 描述
  serviceId: string;         // 所属服务 ID
  version?: string;          // 版本
  authType?: AuthType;       // 认证类型
  requiresAuth?: boolean;    // 是否需要认证
  rateLimit?: number;        // 速率限制
  timeout?: number;          // 超时时间
  tags?: string[];           // 标签
}
```

**响应**:
```typescript
{
  code: 200,
  message: "API 创建成功",
  data: {
    // ApiInfo 对象
  },
  timestamp: number
}
```

---

### 4. 更新 API

**接口**: `PUT /apis/:id`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  name?: string;
  description?: string;
  status?: ApiStatus;
  version?: string;
  authType?: AuthType;
  requiresAuth?: boolean;
  rateLimit?: number;
  timeout?: number;
  tags?: string[];
}
```

**响应**:
```typescript
{
  code: 200,
  message: "API 更新成功",
  data: {
    // ApiInfo 对象
  },
  timestamp: number
}
```

---

### 5. 删除 API

**接口**: `DELETE /apis/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "API 删除成功",
  data: {
    success: true;
    message: "API 删除成功";
  },
  timestamp: number
}
```

---

### 6. 获取 API 调用统计

**接口**: `GET /apis/:id/stats`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    apiId: string;
    totalCalls: 128000;
    successCalls: 125000;
    failedCalls: 3000;
    avgResponseTime: 45.5;
    errorRate: 2.34;
    lastCalledAt: string;
  },
  timestamp: number
}
```

---

### 7. 获取 API 调用日志

**接口**: `GET /apis/:id/call-logs`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=20
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        apiId: string;
        path: string;
        method: HttpMethod;
        statusCode: number;
        responseTime: number;
        ipAddress: string;
        userId?: string;
        timestamp: string;
        errorMessage?: string;
      }
    ],
    total: 1000,
    page: 1,
    pageSize: 20,
    totalPages: 50
  },
  timestamp: number
}
```

---

## 用户管理模块

### 1. 获取用户列表

**接口**: `GET /users`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=10&status=active&roleId=xxx&department=技术部
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        username: string;
        email: string;
        phone?: string;
        avatar?: string;
        roles: string[];
        permissions: string[];
        status: "active" | "inactive" | "suspended" | "pending";
        nickname?: string;
        gender?: "male" | "female" | "other";
        department?: string;
        position?: string;
        lastLoginIp?: string;
        loginCount: number;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: string;
        lastLoginAt?: string;
      }
    ],
    total: 100,
    page: 1,
    pageSize: 10,
    totalPages: 10
  },
  timestamp: number
}
```

---

### 2. 获取用户详情

**接口**: `GET /users/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    // UserDetail 对象
  },
  timestamp: number
}
```

---

### 3. 创建用户

**接口**: `POST /users`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  username: string;
  password: string;
  email: string;
  phone?: string;
  nickname?: string;
  roleIds: string[];
  status?: UserStatus;
  department?: string;
  position?: string;
}
```

**响应**:
```typescript
{
  code: 200,
  message: "用户创建成功",
  data: {
    // UserDetail 对象
  },
  timestamp: number
}
```

---

### 4. 更新用户

**接口**: `PUT /users/:id`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  roleIds?: string[];
  status?: UserStatus;
  department?: string;
  position?: string;
}
```

**响应**:
```typescript
{
  code: 200,
  message: "用户更新成功",
  data: {
    // UserDetail 对象
  },
  timestamp: number
}
```

---

### 5. 删除用户

**接口**: `DELETE /users/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "用户删除成功",
  data: {
    success: true;
    message: "用户删除成功";
  },
  timestamp: number
}
```

---

### 6. 禁用/启用用户

**接口**: `PUT /users/:id/toggle-status`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "用户状态已更新",
  data: {
    // UserDetail 对象
  },
  timestamp: number
}
```

---

### 7. 重置用户密码

**接口**: `POST /users/:id/reset-password`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  newPassword: string;
}
```

**响应**:
```typescript
{
  code: 200,
  message: "密码重置成功",
  data: {
    success: true;
    message: "密码重置成功";
  },
  timestamp: number
}
```

---

### 8. 获取角色列表

**接口**: `GET /roles`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      name: string;
      description?: string;
      permissions: string[];
      isSystem: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ],
  timestamp: number
}
```

---

### 9. 创建角色

**接口**: `POST /roles`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  name: string;
  description?: string;
  permissions: string[];
}
```

**响应**:
```typescript
{
  code: 200,
  message: "角色创建成功",
  data: {
    // Role 对象
  },
  timestamp: number
}
```

---

### 10. 更新角色

**接口**: `PUT /roles/:id`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  name?: string;
  description?: string;
  permissions?: string[];
}
```

**响应**:
```typescript
{
  code: 200,
  message: "角色更新成功",
  data: {
    // Role 对象
  },
  timestamp: number
}
```

---

### 11. 删除角色

**接口**: `DELETE /roles/:id`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "角色删除成功",
  data: {
    success: true;
    message: "角色删除成功";
  },
  timestamp: number
}
```

---

### 12. 获取权限列表

**接口**: `GET /permissions`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      name: string;
      description?: string;
      module: string;
      action: string;
      isSystem: boolean;
    }
  ],
  timestamp: number
}
```

---

## 系统设置模块

### 1. 获取系统配置列表

**接口**: `GET /settings/configs`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      key: string;
      value: string | number | boolean | object;
      description?: string;
      type: "string" | "number" | "boolean" | "json";
      group: string;
      editable: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ],
  timestamp: number
}
```

---

### 2. 获取单个配置

**接口**: `GET /settings/configs/:key`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    // SystemConfig 对象
  },
  timestamp: number
}
```

---

### 3. 更新配置

**接口**: `PUT /settings/configs/:key`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  value: string | number | boolean | object;
}
```

**响应**:
```typescript
{
  code: 200,
  message: "配置更新成功",
  data: {
    // SystemConfig 对象
  },
  timestamp: number
}
```

---

### 4. 批量更新配置

**接口**: `PUT /settings/configs/batch`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  configs: [
    {
      key: string;
      value: string | number | boolean | object;
    }
  ]
}
```

**响应**:
```typescript
{
  code: 200,
  message: "配置批量更新成功",
  data: {
    success: true;
    updated: 5;
  },
  timestamp: number
}
```

---

### 5. 获取系统信息

**接口**: `GET /settings/system-info`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    name: string;
    version: string;
    nodeVersion: string;
    os: string;
    uptime: number;
    startTime: string;
    environment: "development" | "production" | "test";
  },
  timestamp: number
}
```

---

### 6. 获取系统资源使用情况

**接口**: `GET /settings/resource-usage`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    cpuUsage: 45.5;
    memoryUsed: 512;
    memoryTotal: 2048;
    memoryUsage: 25;
    diskUsed: 10.5;
    diskTotal: 100;
    diskUsage: 10.5;
    networkReceived: 1024;
    networkSent: 512;
  },
  timestamp: number
}
```

---

### 7. 获取操作日志

**接口**: `GET /settings/operation-logs`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=20&userId=xxx&module=service&action=create
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        userId: string;
        username: string;
        action: string;
        module: string;
        description: string;
        ipAddress: string;
        userAgent?: string;
        requestData?: Record<string, unknown>;
        responseData?: Record<string, unknown>;
        statusCode: number;
        executionTime: number;
        timestamp: string;
      }
    ],
    total: 500,
    page: 1,
    pageSize: 20
  },
  timestamp: number
}
```

---

### 8. 获取通知设置

**接口**: `GET /settings/notifications`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    emailEnabled: boolean;
    emailRecipients: string[];
    smsEnabled: boolean;
    webhookEnabled: boolean;
    webhookUrl?: string;
    events: string[];
  },
  timestamp: number
}
```

---

### 9. 更新通知设置

**接口**: `PUT /settings/notifications`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```typescript
{
  emailEnabled?: boolean;
  emailRecipients?: string[];
  smsEnabled?: boolean;
  webhookEnabled?: boolean;
  webhookUrl?: string;
  events?: string[];
}
```

**响应**:
```typescript
{
  code: 200,
  message: "通知设置更新成功",
  data: {
    // NotificationSettings 对象
  },
  timestamp: number
}
```

---

## 仪表板模块

### 1. 获取仪表板统计数据

**接口**: `GET /dashboard/stats`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    services: {
      total: 24;
      running: 18;
      stopped: 4;
      error: 2;
      totalCpu: 450;
      totalMemory: 2048;
      avgCpu: 18.75;
      avgMemory: 85.33;
    };
    apiCalls: {
      apiId: string;
      totalCalls: 128000;
      successCalls: 125000;
      failedCalls: 3000;
      avgResponseTime: 45.5;
      errorRate: 2.34;
      lastCalledAt?: string;
    };
    activeUsers: 2845;
    newUsersToday: 23;
    systemUptime: 864000;
    alertCount: 5;
  },
  timestamp: number
}
```

---

### 2. 获取趋势数据

**接口**: `GET /dashboard/trends`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
type=cpu&timeRange=24h
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    title: string;
    type: "line" | "bar" | "area";
    dataPoints: [
      {
        timestamp: string;
        value: number;
        label?: string;
      }
    ];
    unit?: string;
    timeRange: "1h" | "6h" | "24h" | "7d" | "30d";
  },
  timestamp: number
}
```

---

### 3. 获取最近活动

**接口**: `GET /dashboard/activities`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
limit=10
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      time: string;
      action: string;
      target: string;
      user?: string;
      status: "success" | "error" | "warning";
      description?: string;
    }
  ],
  timestamp: number
}
```

---

### 4. 获取告警列表

**接口**: `GET /dashboard/alerts`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
```
page=1&pageSize=10
```

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: {
    list: [
      {
        id: string;
        level: "info" | "warning" | "error" | "critical";
        title: string;
        description: string;
        resourceId?: string;
        resourceType?: "service" | "api" | "user" | "system";
        isRead: boolean;
        createdAt: string;
        resolvedAt?: string;
      }
    ],
    total: 50;
    unreadCount: 5;
  },
  timestamp: number
}
```

---

### 5. 标记告警为已读

**接口**: `PUT /dashboard/alerts/:id/read`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "告警已标记为已读",
  data: {
    success: true;
    message: "告警已标记为已读";
  },
  timestamp: number
}
```

---

### 6. 获取快速操作列表

**接口**: `GET /dashboard/quick-actions`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
{
  code: 200,
  message: "成功",
  data: [
    {
      id: string;
      name: string;
      description: string;
      icon: string;
      actionType: "navigate" | "modal" | "confirm";
      target: string;
    }
  ],
  timestamp: number
}
```

---

## 附录

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 40001 | 参数验证失败 | 检查请求参数是否符合要求 |
| 40101 | 令牌过期 | 使用刷新令牌获取新令牌 |
| 40102 | 令牌无效 | 重新登录获取新令牌 |
| 40301 | 权限不足 | 联系管理员分配相应权限 |
| 40401 | 资源不存在 | 检查资源 ID 是否正确 |
| 50001 | 服务器内部错误 | 联系技术支持 |

### 速率限制

- 默认速率限制：60 请求/分钟
- 可通过 API 配置自定义速率限制
- 超过限制将返回 429 状态码

### 版本控制

API 版本通过 URL 路径控制：`/api/v1/...`

未来版本将在路径中体现：`/api/v2/...`

### 支持

如有问题，请联系技术支持团队或查阅项目文档。
