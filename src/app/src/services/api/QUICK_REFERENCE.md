# API 快速参考

## 接口清单

### 认证模块 (Auth)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录 | ❌ |
| POST | `/auth/refresh` | 刷新令牌 | ❌ |
| GET | `/auth/me` | 获取当前用户信息 | ✅ |
| PUT | `/auth/password` | 修改密码 | ✅ |
| POST | `/auth/logout` | 用户登出 | ✅ |

---

### 服务管理 (Services)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/services` | 获取服务列表（分页） | ✅ |
| GET | `/services/:id` | 获取服务详情 | ✅ |
| POST | `/services` | 创建服务 | ✅ |
| PUT | `/services/:id` | 更新服务 | ✅ |
| DELETE | `/services/:id` | 删除服务 | ✅ |
| POST | `/services/:id/start` | 启动服务 | ✅ |
| POST | `/services/:id/stop` | 停止服务 | ✅ |
| POST | `/services/:id/restart` | 重启服务 | ✅ |
| GET | `/services/stats` | 获取服务统计 | ✅ |
| GET | `/services/:id/metrics` | 获取服务监控数据 | ✅ |
| GET | `/services/:id/logs` | 获取服务日志 | ✅ |

---

### API 管理 (APIs)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/apis` | 获取 API 列表（分页） | ✅ |
| GET | `/apis/:id` | 获取 API 详情 | ✅ |
| POST | `/apis` | 创建 API | ✅ |
| PUT | `/apis/:id` | 更新 API | ✅ |
| DELETE | `/apis/:id` | 删除 API | ✅ |
| GET | `/apis/:id/stats` | 获取 API 调用统计 | ✅ |
| GET | `/apis/:id/call-logs` | 获取 API 调用日志（分页） | ✅ |

---

### 用户管理 (Users)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/users` | 获取用户列表（分页） | ✅ |
| GET | `/users/:id` | 获取用户详情 | ✅ |
| POST | `/users` | 创建用户 | ✅ |
| PUT | `/users/:id` | 更新用户 | ✅ |
| DELETE | `/users/:id` | 删除用户 | ✅ |
| PUT | `/users/:id/toggle-status` | 禁用/启用用户 | ✅ |
| POST | `/users/:id/reset-password` | 重置用户密码 | ✅ |
| GET | `/roles` | 获取角色列表 | ✅ |
| POST | `/roles` | 创建角色 | ✅ |
| PUT | `/roles/:id` | 更新角色 | ✅ |
| DELETE | `/roles/:id` | 删除角色 | ✅ |
| GET | `/permissions` | 获取权限列表 | ✅ |

---

### 系统设置 (Settings)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/settings/configs` | 获取系统配置列表 | ✅ |
| GET | `/settings/configs/:key` | 获取单个配置 | ✅ |
| PUT | `/settings/configs/:key` | 更新配置 | ✅ |
| PUT | `/settings/configs/batch` | 批量更新配置 | ✅ |
| GET | `/settings/system-info` | 获取系统信息 | ✅ |
| GET | `/settings/resource-usage` | 获取资源使用情况 | ✅ |
| GET | `/settings/operation-logs` | 获取操作日志（分页） | ✅ |
| GET | `/settings/notifications` | 获取通知设置 | ✅ |
| PUT | `/settings/notifications` | 更新通知设置 | ✅ |

---

### 仪表板 (Dashboard)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/dashboard/stats` | 获取统计数据 | ✅ |
| GET | `/dashboard/trends` | 获取趋势数据 | ✅ |
| GET | `/dashboard/activities` | 获取最近活动 | ✅ |
| GET | `/dashboard/alerts` | 获取告警列表（分页） | ✅ |
| PUT | `/dashboard/alerts/:id/read` | 标记告警为已读 | ✅ |
| GET | `/dashboard/quick-actions` | 获取快速操作列表 | ✅ |

---

## 数据库表建议

基于接口定义，建议创建以下数据库表：

### 核心表

1. **users** - 用户表
   - id, username, password, email, phone, avatar, status, nickname, gender, department, position, last_login_ip, login_count, email_verified, phone_verified, created_at, updated_at

2. **roles** - 角色表
   - id, name, description, is_system, created_at, updated_at

3. **permissions** - 权限表
   - id, name, description, module, action, is_system

4. **user_roles** - 用户角色关联表
   - user_id, role_id

5. **role_permissions** - 角色权限关联表
   - role_id, permission_id

6. **services** - 服务表
   - id, name, description, port, status, pid, version, tags (JSON), env (JSON), started_at, last_heartbeat, created_at, updated_at

7. **service_metrics** - 服务监控数据表
   - id, service_id, timestamp, cpu, memory, requests, errors, response_time

8. **service_logs** - 服务日志表
   - id, service_id, timestamp, level, message, module, meta (JSON)

9. **apis** - API 表
   - id, path, method, name, description, status, service_id, version, auth_type, requires_auth, rate_limit, timeout, request_schema (JSON), response_schema (JSON), tags (JSON), created_at, updated_at

10. **api_call_logs** - API 调用日志表
    - id, api_id, path, method, status_code, response_time, ip_address, user_id, error_message, timestamp

11. **api_call_stats** - API 调用统计表
    - id, api_id, total_calls, success_calls, failed_calls, avg_response_time, error_rate, last_called_at, updated_at

12. **system_configs** - 系统配置表
    - id, key, value (TEXT), description, type, group, editable, created_at, updated_at

13. **operation_logs** - 操作日志表
    - id, user_id, username, action, module, description, ip_address, user_agent, request_data (JSON), response_data (JSON), status_code, execution_time, timestamp

14. **alerts** - 告警表
    - id, level, title, description, resource_id, resource_type, is_read, created_at, resolved_at

15. **notification_settings** - 通知设置表
    - id, email_enabled, email_recipients (JSON), sms_enabled, webhook_enabled, webhook_url, events (JSON), updated_at

16. **refresh_tokens** - 刷新令牌表
    - id, user_id, token, expires_at, created_at

---

## Redis 缓存建议

### 缓存键设计

```
# 用户会话
user:session:{userId} -> JWT Token 信息

# 服务状态
service:status:{serviceId} -> { status, cpu, memory, pid }

# API 速率限制
api:ratelimit:{apiId}:{ip} -> 请求计数

# 系统配置
system:config:{key} -> 配置值

# 告警未读数
alert:unread:count -> 数量
```

### 过期策略

- 用户会话：根据 token 过期时间
- 服务状态：30 秒
- API 速率限制：1 分钟滑动窗口
- 系统配置：永久（更新时失效）
- 告警未读数：实时更新

---

## 中间件建议

### 1. 认证中间件

```typescript
// 验证 JWT Token
// 将用户信息注入到 req.user
```

### 2. 权限中间件

```typescript
// 检查用户是否有相应权限
// @Permissions('service:create')
```

### 3. 速率限制中间件

```typescript
// 基于 IP 或用户的速率限制
// throttle(60) // 60 请求/分钟
```

### 4. 操作日志中间件

```typescript
// 记录所有写操作的日志
// 自动捕获请求和响应数据
```

### 5. 异常过滤器

```typescript
// 统一异常处理
// 返回标准错误格式
```

---

## 环境变量配置

```env
# 服务器
PORT=3000
NODE_ENV=production

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pnce_platform
DB_USER=admin
DB_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# 邮件服务（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=secret

# 短信服务（可选）
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY=xxx
SMS_ACCESS_SECRET=xxx
```

---

## 开发优先级建议

### Phase 1: 基础功能
1. ✅ 用户认证（登录、登出、刷新令牌）
2. ✅ 用户管理（CRUD）
3. ✅ 角色和权限管理

### Phase 2: 核心业务
4. ✅ 服务管理（CRUD + 启停控制）
5. ✅ 服务监控数据采集
6. ✅ API 管理（CRUD）

### Phase 3: 增强功能
7. ✅ 仪表板统计数据
8. ✅ 系统配置管理
9. ✅ 操作日志记录

### Phase 4: 高级功能
10. ✅ 告警系统
11. ✅ 通知系统
12. ✅ 高级监控和分析

---

## 测试建议

### 单元测试
- 服务层逻辑测试
- 工具函数测试

### 集成测试
- API 接口测试
- 数据库操作测试

### E2E 测试
- 用户登录流程
- 服务管理流程
- 权限控制测试

---

## 性能优化建议

1. **数据库索引**
   - users.username (UNIQUE)
   - users.email (UNIQUE)
   - services.status
   - apis.service_id
   - operation_logs.timestamp

2. **查询优化**
   - 使用分页避免大数据量查询
   - 适当使用缓存减少数据库压力
   - 慢查询日志监控

3. **连接池**
   - 数据库连接池配置
   - Redis 连接池配置

4. **异步处理**
   - 日志记录异步化
   - 邮件/短信发送队列化
   - 监控数据批量写入

---

祝你开发顺利！🚀
