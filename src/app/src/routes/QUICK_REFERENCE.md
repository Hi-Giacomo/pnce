# 路由权限控制 - 快速参考

## 🎯 核心 API

### 检查权限

```typescript
import { root } from '@/hooks';

const user = root.user;

// 单个权限
user.hasPermission('service:view')

// 任一权限
user.hasAnyPermission(['service:create', 'service:update'])

// 所有权限
user.hasAllPermissions(['service:view', 'service:control'])

// 角色检查
user.hasRole('admin')
```

---

## 📋 权限列表

### 仪表盘
- `dashboard:view` - 查看仪表盘

### 服务管理
- `service:view` - 查看服务
- `service:create` - 创建服务
- `service:update` - 更新服务
- `service:delete` - 删除服务
- `service:control` - 控制服务（启停）

### API 管理
- `api:view` - 查看 API
- `api:create` - 创建 API
- `api:update` - 更新 API
- `api:delete` - 删除 API

### 用户管理
- `user:view` - 查看用户
- `user:create` - 创建用户
- `user:update` - 更新用户
- `user:delete` - 删除用户
- `user:role-manage` - 管理角色

### 系统设置
- `setting:view` - 查看设置
- `setting:update` - 更新设置

---

## 👥 角色说明

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `admin` | 管理员 | 所有权限 |
| `developer` | 开发者 | 服务和 API 管理 |
| `viewer` | 查看者 | 仅查看权限 |

---

## 🔧 常用场景

### 1. 条件渲染按钮

```tsx
{user.hasPermission('service:create') && (
  <button>创建服务</button>
)}
```

### 2. 保护整个页面

```tsx
// routes/index.tsx - 已自动配置
{
  path: 'services',
  element: (
    <ProtectedRoute>
      <Services />
    </ProtectedRoute>
  ),
}
```

### 3. 自定义 Hook

```tsx
function usePermission(permission: UserPermission) {
  return root.user.hasPermission(permission);
}

// 使用
const canView = usePermission('service:view');
```

### 4. 多个权限检查

```tsx
const canManage = user.hasAnyPermission([
  'service:create',
  'service:update',
  'service:delete'
]);
```

---

## 📁 文件位置

```
src/
├── hooks/user.store.ts              # 用户状态（含权限）
├── routes/
│   ├── index.tsx                    # 路由配置
│   ├── permissions.ts               # 权限配置
│   ├── ProtectedRoute.tsx           # 路由守卫
│   └── PERMISSION_GUIDE.md          # 详细文档
```

---

## ⚡ 快速示例

### 登录时设置权限

```typescript
// 当前为模拟实现，默认 admin 角色
user.login('username', 'password');
// 自动设置 roles: ['admin'] 和所有 permissions
```

### 从后端获取权限（未来实现）

```typescript
async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  const { roles, permissions } = response.data.user;
  
  user.roles = roles;
  user.permissions = permissions;
  user.isLoggedIn = true;
  
  notify(); // 触发更新
}
```

---

## 🔒 安全提醒

> ⚠️ **前端权限仅用于 UI 控制，不能替代后端验证！**
> 
> 所有敏感操作必须在后端进行权限检查。

---

## 📖 更多信息

- [完整指南](./PERMISSION_GUIDE.md)
- [使用示例](./permission-examples.tsx)
- [实现总结](./IMPLEMENTATION_SUMMARY.md)

---

**更新日期**: 2026-04-08
