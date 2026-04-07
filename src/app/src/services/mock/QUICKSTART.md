# Mock 数据系统 - 快速开始

## 🎯 一句话说明

无需后端，即可完整体验整个应用的所有功能！

---

## 🚀 30 秒快速体验

### 步骤 1: 启动项目

```bash
cd /Users/whaoa/Developer/Codes/pnce/cli/src/app
npm run dev
```

### 步骤 2: 访问登录页

打开浏览器访问：`http://localhost:5173/login`

### 步骤 3: 使用测试账号登录

| 用户名 | 密码 | 说明 |
|--------|------|------|
| **admin** | 123456 | 管理员（推荐） |
| developer | 123456 | 开发者 |
| viewer | 123456 | 查看者 |

### 步骤 4: 探索功能

登录后可以体验：
- ✅ 仪表板 - 查看统计数据和图表
- ✅ 服务管理 - 查看、启动、停止服务
- ✅ API 管理 - 浏览 API 列表
- ✅ 用户管理 - 查看用户列表
- ✅ 系统设置 - 查看配置选项

---

## 📦 Mock 数据包含什么？

### 1. 用户数据 (3个账号)

```typescript
admin     - 拥有所有 17 个权限
developer - 拥有 9 个权限（开发相关）
viewer    - 拥有 3 个权限（仅查看）
```

### 2. 服务数据 (5个服务)

```
用户服务   - 运行中 (CPU: 45%, 内存: 128MB)
订单服务   - 运行中 (CPU: 62%, 内存: 256MB)
支付服务   - 已停止
消息服务   - 运行中 (CPU: 28%, 内存: 96MB)
文件服务   - 错误状态
```

### 3. 仪表板数据

- 统计数据：服务数、API 调用量、活跃用户等
- 最近活动：6 条模拟活动记录
- 告警信息：5 条不同级别的告警

### 4. 监控数据

- 24 小时的服务监控趋势
- CPU、内存、请求量等指标

---

## 💻 如何在代码中使用

### 示例 1: 登录

```typescript
import { mockApi } from '@/services/mock/mock-api';

const result = await mockApi.auth.login({
  username: 'admin',
  password: '123456'
});

if (result.code === 200) {
  console.log('登录成功', result.data.user);
}
```

### 示例 2: 获取服务列表

```typescript
const services = await mockApi.service.getServices(1, 10);
console.log('服务列表:', services.data.list);
```

### 示例 3: 启动服务

```typescript
await mockApi.service.startService('1');
console.log('服务已启动');
```

### 示例 4: 获取仪表板数据

```typescript
const stats = await mockApi.dashboard.getStats();
const activities = await mockApi.dashboard.getRecentActivities(10);
```

---

## 🎨 测试页面

访问 `/mock-test` 路径可以看到一个专门的测试页面，展示所有 Mock 数据的功能。

**注意**: 需要先在路由中添加该页面：

```typescript
// routes/index.tsx
{
  path: '/mock-test',
  element: <MockTestPage />,
}
```

---

## 🔧 可用的 Mock API

### 认证服务

```typescript
mockApi.auth.login(credentials)        // 登录
mockApi.auth.logout()                  // 登出
mockApi.auth.getCurrentUser()          // 获取当前用户
```

### 服务管理

```typescript
mockApi.service.getServices(page, pageSize)     // 获取服务列表
mockApi.service.getServiceDetail(id)            // 获取服务详情
mockApi.service.startService(id)                // 启动服务
mockApi.service.stopService(id)                 // 停止服务
mockApi.service.getServiceStats()               // 获取服务统计
mockApi.service.getServiceMetrics(id)           // 获取监控数据
```

### 仪表板

```typescript
mockApi.dashboard.getStats()                    // 获取统计数据
mockApi.dashboard.getRecentActivities(limit)    // 获取最近活动
mockApi.dashboard.getAlerts(page, pageSize)     // 获取告警列表
mockApi.dashboard.markAlertAsRead(id)           // 标记告警为已读
```

---

## ⚙️ 配置说明

### 模拟延迟

所有 API 都添加了模拟延迟，让体验更真实：

- 登录：800ms
- 服务操作：500ms
- 仪表板：400ms
- 其他：200-300ms

### 修改延迟时间

编辑对应的 mock 文件：

```typescript
// users.mock.ts
export const MOCK_LOGIN_DELAY = 800; // 修改这个值

// services.mock.ts
export const MOCK_SERVICE_DELAY = 500;

// dashboard.mock.ts
export const MOCK_DASHBOARD_DELAY = 400;
```

---

## 📝 测试账号详情

### Admin (管理员)

```
用户名: admin
密码: 123456
角色: admin
权限: 所有 17 个权限
可访问: 所有页面和功能
```

### Developer (开发者)

```
用户名: developer
密码: 123456
角色: developer
权限: 9 个（仪表盘、服务、API）
可访问: 仪表盘、服务管理、API 管理
```

### Viewer (查看者)

```
用户名: viewer
密码: 123456
角色: viewer
权限: 3 个（仅查看）
可访问: 仪表盘、服务列表（只读）、API 列表（只读）
```

---

## 🎯 常见测试场景

### 场景 1: 测试权限控制

1. 用 `viewer` 账号登录
2. 只能看到仪表盘菜单
3. 尝试访问 `/manager/users` 会被重定向

### 场景 2: 测试服务管理

1. 用 `admin` 账号登录
2. 进入服务管理页面
3. 点击"启动"或"停止"按钮
4. 观察服务状态变化

### 场景 3: 测试仪表板

1. 登录后查看统计数据
2. 查看最近活动列表
3. 查看告警信息

---

## ⚠️ 注意事项

### 1. 数据不持久化

刷新页面后，所有修改都会重置。这是正常的，因为数据在内存中。

### 2. 随机数据

CPU、内存等数值是随机生成的，每次刷新会不同。

### 3. 仅用于开发

Mock 数据只在开发环境使用，生产环境应该连接真实后端。

### 4. 密码固定

所有测试账号的密码都是 `123456`，硬编码在 Mock 中。

---

## 🔌 切换到真实 API

当后端开发完成后，可以轻松切换：

### 方法 1: 条件导入

```typescript
// api.ts
import { mockApi } from './mock/mock-api';
import { realApi } from './real-api';

export const api = import.meta.env.DEV ? mockApi : realApi;
```

### 方法 2: 环境变量

```env
# .env.development
VITE_USE_MOCK=true

# .env.production  
VITE_USE_MOCK=false
```

---

## 📚 更多文档

- [详细使用指南](./README.md) - 完整的 Mock 数据文档
- [API 接口文档](../services/api/API_DOCUMENTATION.md) - 后端接口规范
- [权限控制指南](../routes/PERMISSION_GUIDE.md) - 权限系统说明

---

## ❓ 常见问题

### Q: 为什么登录失败？

A: 确保密码是 `123456`，用户名是 `admin`、`developer` 或 `viewer`。

### Q: 如何添加更多测试数据？

A: 编辑对应的 mock 文件，在数组中添加新对象即可。

### Q: Mock 数据会影响性能吗？

A: 不会，Mock 数据非常快，延迟是为了模拟真实环境。

### Q: 可以在生产环境使用吗？

A: 不建议，Mock 数据仅用于开发和测试。

---

## 🎉 开始体验

现在就启动项目，使用 `admin / 123456` 登录，开始探索吧！

```bash
npm run dev
```

祝测试愉快！🚀
