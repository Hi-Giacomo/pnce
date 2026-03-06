# 登录要求说明

## 概述

Pnce CLI 采用灵活的认证机制，**仅在涉及云端操作时才需要登录**，本地操作和公开访问不需要认证。

## 📋 需要登录的操作

仅限以下**云端操作**需要登录：

| 操作 | 命令 | 说明 |
|------|------|------|
| 上传模块 | `pnce upload` | 发布模块到云端注册中心 |
| 发布模块 | `pnce publish` | 同上，upload的别名 |
| 删除云端模块 | 未来版本 | 从云端删除模块 |
| 更新云端模块版本 | 未来版本 | 更新云端模块版本 |

**登录方式**：

```bash
# 方式1：OAuth2 浏览器登录（推荐）
pnce login

# 方式2：邮箱密码登录
pnce login -e your@email.com -p your-password

# 方式3：注册新账户
pnce register

# 查看登录状态
pnce me

# 登出
pnce logout
```

## ❓ 不需要登录的操作

以下**本地操作和公开访问****不需要登录**：

### 模块安装

```bash
# 安装单个模块 - 无需登录
pnce install user-module

# 安装指定版本 - 无需登录
pnce install user-module@1.0.0

# 批量安装 - 无需登录
pnce install-batch auth-module user-module payment-module
```

### 模块信息查询

```bash
# 搜索模块 - 无需登录
pnce search user

# 查看模块详情 - 无需登录
pnce info user-module

# 查看模块列表 - 无需登录
pnce list

# 查看热门模块 - 无需登录
pnce trending

# 查看统计信息 - 无需登录
pnce stats
```

### 项目初始化

```bash
# 创建服务 - 无需登录
pnce init service my-app

# 创建微服务 - 无需登录
pnce init microservice my-service
```

### 依赖管理

```bash
# 添加依赖 - 无需登录
pnce modules add auth-module

# 安装依赖 - 无需登录
pnce modules install

# 查看依赖列表 - 无需登录
pnce modules list

# 移除依赖 - 无需登录
pnce modules remove auth-module

# 更新依赖 - 无需登录
pnce modules update
```

### 端口管理

```bash
# 分配端口 - 无需登录
pnce port assign user-module

# 释放端口 - 无需登录
pnce port release user-module

# 查看端口 - 无需登录
pnce port list
```

### 配置管理

```bash
# 查看注册中心配置 - 无需登录
pnce registry get

# 设置注册中心 - 无需登录
pnce registry set http://localhost:3000

# 重置注册中心 - 无需登录
pnce registry reset

# 测试连接 - 无需登录
pnce registry ping
```

## 🔍 判断是否需要登录的规则

### 简单判断法

- 涉及**读取**或**下载**公开资源 → 不需要登录 ✅
- 涉及**上传**或**修改**云端资源 → 需要登录 ❌
- 涉及**本地文件系统**操作 → 不需要登录 ✅

### 详细判断表

| 操作类型 | 涉及资源 | 需要登录 | 示例 |
|---------|---------|---------|------|
| 读取 | 公开模块信息 | ❌ 否 | `pnce info` |
| 下载 | 公开模块 | ❌ 否 | `pnce install` |
| 搜索 | 公开模块列表 | ❌ 否 | `pnce search` |
| 上传 | 用户模块 | ✅ 是 | `pnce upload` |
| 删除 | 用户模块 | ✅ 是 | 未来版本 |
| 更新 | 用户模块 | ✅ 是 | 未来版本 |
| 本地 | 项目文件 | ❌ 否 | `pnce init` |
| 本地 | 配置文件 | ❌ 否 | `pnce registry` |
| 本地 | 依赖管理 | ❌ 否 | `pnce modules` |

## 💡 使用示例

### 场景1：安装模块（无需登录）

```bash
# ✅ 直接安装，无需登录
pnce install user-module

# ✅ 批量安装，无需登录
pnce install-batch auth-module user-module payment-module
```

### 场景2：上传模块（需要登录）

```bash
# ✅ 先登录
pnce login

# ✅ 再上传
cd my-module
pnce upload
```

### 场景3：CI/CD 环境（使用环境变量）

```yaml
# GitHub Actions
env:
  PNCE_API_SERVER: "https://api.example.com"
  PNCE_TOKEN: ${{ secrets.PNCE_TOKEN }}

steps:
  # 安装模块 - 不需要 Token
  - run: pnce install user-module

  # 上传模块 - 需要 Token
  - run: pnce upload
```

### 场景4：团队协作

**开发者A**：
```bash
# ✅ 安装模块 - 无需登录
pnce install auth-module

# ✅ 开发完成后上传 - 需要登录
pnce login
pnce upload
```

**开发者B**：
```bash
# ✅ 安装 A 开发的模块 - 无需登录
pnce install a-module

# ✅ 查看模块信息 - 无需登录
pnce info a-module
```

## 🔐 Token 管理

### 自动保存

登录成功后，Token 会自动保存到：
- 用户配置：`~/.pnce/config.json`

### 自动过期

Token 会自动检测过期，过期后会提示重新登录：
```
Token已过期，请重新登录
pnce login
```

### 手动管理

```bash
# 查看 Token 状态
pnce me

# 登出清除 Token
pnce logout

# 清除所有配置（包括 Token）
rm -rf ~/.pnce
```

## 🌐 公开 vs 私有模块

### 公开模块

- ✅ 所有人可搜索、查看、安装
- ✅ 无需登录即可使用
- ✅ 适合开源社区

### 私有模块

- ⚠️ 需要登录才能访问
- ⚠️ 需要授权才能安装
- ⚠️ 适合内部团队使用

**注意**：当前版本主要支持公开模块，私有模块支持待开发。

## 🎯 最佳实践

### 开发流程

1. **开发阶段** - 无需登录
   ```bash
   pnce init service my-app
   pnce install auth-module user-module
   ```

2. **测试阶段** - 无需登录
   ```bash
   pnce install other-modules
   ```

3. **发布阶段** - 需要登录
   ```bash
   pnce login
   pnce upload
   ```

### 团队协作

1. **公共模块**：
   - 开发者：登录上传
   - 使用者：无需登录安装

2. **私有模块**：
   - 开发者：登录上传
   - 使用者：登录后安装

### CI/CD

```yaml
# 安装公开模块 - 无需 Token
- run: pnce install public-module

# 上传私有模块 - 需要 Token
- env:
    PNCE_TOKEN: ${{ secrets.PNCE_TOKEN }}
  run: pnce upload
```

## ❓ 常见问题

### Q1: 为什么安装模块不需要登录？

**A**: 因为模块库是公开的，所有人都可以访问。这类似于 `npm install`，不需要登录就能安装公开包。

### Q2: 什么时候需要登录？

**A**: 只有当你需要**上传、删除或更新**云端模块时才需要登录。

### Q3: Token 过期了怎么办？

**A**: CLI 会自动检测并提示你重新登录：
```bash
pnce login
```

### Q4: 可以在 CI/CD 中使用吗？

**A**: 可以！通过环境变量设置 Token：
```yaml
env:
  PNCE_TOKEN: ${{ secrets.PNCE_TOKEN }}
```

### Q5: 如何查看当前登录状态？

**A**:
```bash
pnce me
```

### Q6: 可以在没有网络的情况下使用吗？

**A**: 可以！本地操作（如 `pnce init`、`pnce modules`）不需要网络。但涉及云端操作（如 `pnce install`、`pnce search`）需要网络。

### Q7: 如何退出登录？

**A**:
```bash
pnce logout
```

### Q8: Token 存储在哪里？

**A**: 存储在用户配置文件中：
- `~/.pnce/config.json`

### Q9: 如何清除所有登录信息？

**A**:
```bash
# 清除 Token
pnce logout

# 清除所有配置（包括 Token）
rm -rf ~/.pnce
```

### Q10: 是否支持多账户？

**A**: 当前版本只支持单账户登录。多账户支持待开发。

## 📚 总结

| 操作类型 | 需要登录 | 说明 |
|---------|---------|------|
| 安装模块 | ❌ 否 | 公开资源，无需认证 |
| 搜索模块 | ❌ 否 | 公开资源，无需认证 |
| 查看信息 | ❌ 否 | 公开资源，无需认证 |
| 上传模块 | ✅ 是 | 用户操作，需要认证 |
| 本地操作 | ❌ 否 | 本地文件系统 |

**记住**：
- 📥 **下载/读取** → 不需要登录
- 📤 **上传/修改** → 需要登录
- 💾 **本地操作** → 不需要登录

---

**让开发更简单！** 🚀
