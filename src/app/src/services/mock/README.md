# Mock 数据使用指南

## 概述

本项目提供了完整的 Mock 数据系统，让你可以在没有后端的情况下完整体验整个应用流程。

## 快速开始

### 1. 登录测试账号

系统预置了 3 个测试账号，密码都是 `123456`：

| 用户名 | 密码 | 角色 | 权限范围 |
|--------|------|------|----------|
| `admin` | 123456 | 管理员 | 所有权限 |
| `developer` | 123456 | 开发者 | 服务和 API 管理 |
| `viewer` | 123456 | 查看者 | 仅查看权限 |

### 2. 体验流程

```
1. 访问 http://localhost:5173/login
2. 输入用户名：admin
3. 输入密码：123456
4. 点击登录
5. 自动跳转到仪表板
6. 浏览各个页面和功能
```

---

## Mock 数据文件结构

```
src/services/mock/
├── users.mock.ts          # 用户相关 Mock 数据
├── services.mock.ts       # 服务管理 Mock 数据
├── dashboard.mock.ts      # 仪表板 Mock 数据
├── mock-api.ts            # Mock API 服务层
└── README.md              # 本文档
```

---

## 可用的 Mock API

### 认证服务 (mockApi.auth)

```typescript
import { mockApi } from '@/services/mock/mock-api';

// 登录
const result = await mockApi.auth.login({
  username: 'admin',
  password: '123456'
});

// 登出
await mockApi.auth.logout();

// 获取当前用户
const user = await mockApi.auth.getCurrentUser();
```

### 服务管理 (mockApi.service)

```typescript
// 获取服务列表
const services = await mockApi.service.getServices(1, 10);

// 获取服务详情
const service = await mockApi.service.getServiceDetail('1');

// 启动服务
await mockApi.service.startService('1');

// 停止服务
await mockApi.service.stopService('1');

// 获取服务统计
const stats = await mockApi.service.getServiceStats();

// 获取服务监控数据
const metrics = await mockApi.service.getServiceMetrics('1');
```

### 仪表板 (mockApi.dashboard)

```typescript
// 获取统计数据
const stats = await mockApi.dashboard.getStats();

// 获取最近活动
const activities = await mockApi.dashboard.getRecentActivities(10);

// 获取告警列表
const alerts = await mockApi.dashboard.getAlerts(1, 10);

// 标记告警为已读
await mockApi.dashboard.markAlertAsRead('1');
```

---

## Mock 数据说明

### 用户数据

**3 个测试用户：**

1. **admin** - 管理员
   - 拥有所有 17 个权限
   - 可以访问所有页面和功能
   - 邮箱：admin@example.com

2. **developer** - 开发者
   - 拥有 9 个权限（仪表盘、服务、API）
   - 无法访问用户管理和系统设置
   - 邮箱：dev@example.com

3. **viewer** - 查看者
   - 拥有 3 个权限（仅查看）
   - 只能查看仪表盘、服务和 API
   - 邮箱：viewer@example.com

### 服务数据

**5 个模拟服务：**

1. **用户服务** - 运行中 (端口 3001)
2. **订单服务** - 运行中 (端口 3002)
3. **支付服务** - 已停止 (端口 3003)
4. **消息服务** - 运行中 (端口 3004)
5. **文件服务** - 错误状态 (端口 3005)

每个服务包含：
- CPU 和内存使用率
- 进程 ID
- 启动时间
- 版本信息
- 标签

### 仪表板数据

**统计数据：**
- 总服务数：24
- 运行中：18
- 已停止：4
- 错误：2
- API 调用：128K
- 活跃用户：2,845

**最近活动：** 6 条模拟活动记录

**告警：** 5 条不同级别的告警

---

## 在组件中使用 Mock 数据

### 示例 1：登录页面

```typescript
import { mockApi } from '@/services/mock/mock-api';

async function handleLogin(username: string, password: string) {
  const result = await mockApi.auth.login({ username, password });
  
  if (result.code === 200) {
    // 登录成功，更新用户状态
    const { user } = result.data;
    root.user.roles = user.roles;
    root.user.permissions = user.permissions;
    root.user.isLoggedIn = true;
    
    // 跳转到仪表板
    navigate('/manager/dashboard');
  } else {
    // 显示错误消息
    alert(result.message);
  }
}
```

### 示例 2：仪表板页面

```typescript
import { mockApi } from '@/services/mock/mock-api';
import { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    // 加载仪表板数据
    mockApi.dashboard.getStats().then(res => {
      setStats(res.data);
    });
    
    mockApi.dashboard.getRecentActivities(10).then(res => {
      setActivities(res.data);
    });
  }, []);
  
  return (
    <div>
      {/* 显示统计数据 */}
      <p>总服务数：{stats?.services.total}</p>
      
      {/* 显示最近活动 */}
      {activities.map(activity => (
        <div key={activity.id}>{activity.action}</div>
      ))}
    </div>
  );
}
```

### 示例 3：服务管理页面

```typescript
import { mockApi } from '@/services/mock/mock-api';

async function toggleService(serviceId: string, isRunning: boolean) {
  if (isRunning) {
    await mockApi.service.stopService(serviceId);
  } else {
    await mockApi.service.startService(serviceId);
  }
  
  // 重新加载服务列表
  loadServices();
}
```

---

## 模拟延迟

所有 Mock API 都添加了模拟延迟，让体验更接近真实环境：

- 登录：800ms
- 服务操作：500ms
- 仪表板数据：400ms
- 其他操作：200-300ms

---

## 切换 Mock 和真实 API

### 方法 1：条件导入

```typescript
// config.ts
export const USE_MOCK = import.meta.env.DEV;

// api-client.ts
import { USE_MOCK } from './config';
import { mockApi } from './mock/mock-api';
import { realApi } from './real-api';

export const api = USE_MOCK ? mockApi : realApi;
```

### 方法 2：环境变量

```env
# .env.development
VITE_USE_MOCK=true

# .env.production
VITE_USE_MOCK=false
```

```typescript
const useMock = import.meta.env.VITE_USE_MOCK === 'true';
```

---

## 扩展 Mock 数据

### 添加新的 Mock 数据

1. 在对应的 mock 文件中添加数据：

```typescript
// users.mock.ts
export const mockUsers: UserInfo[] = [
  // ... 现有数据
  {
    id: '4',
    username: 'newuser',
    email: 'new@example.com',
    // ... 其他字段
  }
];
```

2. 在 mock-api.ts 中添加对应的 API 方法：

```typescript
export const mockUserService = {
  async getUsers() {
    await delay(500);
    return {
      code: 200,
      data: mockUsers,
      timestamp: Date.now(),
    };
  }
};
```

3. 导出新的服务：

```typescript
export const mockApi = {
  auth: mockAuthService,
  service: mockServiceService,
  dashboard: mockDashboardService,
  user: mockUserService,  // 新增
};
```

---

## 注意事项

### 1. 数据持久化

⚠️ **Mock 数据不会持久化**，刷新页面后所有修改都会重置。

如果需要持久化，可以：
- 使用 localStorage
- 使用 IndexedDB
- 连接到真实的后端

### 2. 随机数据

某些数据（如 CPU、内存使用率）是随机生成的，每次刷新会不同。

### 3. 密码验证

所有测试账号的密码都是 `123456`，这是硬编码在 Mock 中的。

### 4. 开发环境专用

Mock 数据仅用于开发和测试，生产环境应该使用真实的后端 API。

---

## 常见问题

### Q1: 如何修改测试账号的密码？

编辑 `users.mock.ts`，在 `mockAuthService.login` 方法中修改：

```typescript
if (!user || request.password !== 'your_new_password') {
  // ...
}
```

### Q2: 如何添加更多测试数据？

直接在对应的 mock 数组中添加新对象即可：

```typescript
export const mockServices: ServiceInfo[] = [
  // ... 现有数据
  {
    id: '6',
    name: '新服务',
    // ... 其他字段
  }
];
```

### Q3: Mock 数据会影响性能吗？

不会。Mock 数据非常快，模拟的延迟也是为了更真实的体验。

### Q4: 如何在生产环境禁用 Mock？

使用环境变量控制：

```typescript
const useMock = import.meta.env.MODE === 'development';
```

---

## 下一步

1. ✅ 使用 Mock 数据熟悉应用功能
2. 📝 根据需求调整 Mock 数据
3. 🔌 开发真实的后端 API
4. 🔄 逐步替换 Mock 为真实 API

---

**祝测试愉快！** 🎉
