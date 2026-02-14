# Pnce CLI 发布指南

本文档指导如何将 `pnce` CLI 工具发布到 npm。

## 📋 发布前检查清单

- [ ] package.json 中的 name 为 `pnce`
- [ ] package.json 中包含正确的 `bin` 配置
- [ ] 所有 TypeScript 文件已编译
- [ ] `dist/` 目录包含所有必需的编译输出
- [ ] `README.md` 文档完整
- [ ] 版本号已更新
- [ ] 测试通过

## 🔧 配置文件

### package.json 关键配置

```json
{
  "name": "pnce",
  "version": "1.0.0",
  "description": "Pnce CLI Tool - 模块化快速开发命令行工具",
  "main": "dist/index.js",
  "bin": {
    "pnce": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

**重要说明：**
- `bin` 字段指定了全局安装后的命令名称
- `files` 字段指定了发布到 npm 的文件（不包含 src、.git 等）

## 🚀 发布步骤

### 1. 准备发布

```bash
# 进入项目目录
cd command-line-tools

# 安装依赖
npm install

# 构建项目
npm run build

# 验证 dist 目录
ls -la dist/
```

### 2. 登录 npm（如果未登录）

```bash
npm login
```

按提示输入用户名、密码和邮箱。

### 3. 检查包名是否可用

```bash
npm search pnce
# 或者访问 https://www.npmjs.com/package/pnce
```

### 4. 更新版本号（如需要）

```bash
# 更新版本（patch 版本）
npm version patch

# 或者手动编辑 package.json
# version: "1.0.0" -> "1.0.1"
```

### 5. 本地测试（推荐）

```bash
# 创建全局链接
npm link

# 测试命令
pnce --version
pnce --help
pnce list

# 测试完成后取消链接
npm unlink
```

### 6. 发布到 npm

```bash
# 发布公开包
npm publish

# 如果是私有包（需要 npm 付费账户）
# npm publish --access restricted
```

### 7. 验证发布

```bash
# 在 npm 上搜索
npm search pnce

# 或访问
# https://www.npmjs.com/package/pnce
```

## 🧪 测试安装

发布成功后，用户可以这样安装：

```bash
# 全局安装
npm install -g pnce

# 验证安装
pnce --version
pnce --help

# 使用命令
pnce list
pnce search auth
```

## 📝 版本管理

使用语义化版本（Semantic Versioning）：

```bash
# 补丁版本：修复 bug
npm version patch   # 1.0.0 -> 1.0.1

# 次版本：添加新功能，不破坏兼容
npm version minor   # 1.0.0 -> 1.1.0

# 主版本：破坏性变更
npm version major   # 1.0.0 -> 2.0.0
```

## 🔐 npm 账户管理

### 创建账户

1. 访问 https://www.npmjs.com/signup
2. 注册账户
3. 验证邮箱

### 发布公开包

- 免费账户可以发布公开包
- 公开包可以被任何人安装使用

### 发布私有包

- 需要 npm 付费账户
- 私有包只有授权用户可以访问

## 📊 发布检查

发布前运行以下检查：

```bash
# 检查包配置
npm pack

# 这会生成一个 .tgz 文件
# 检查文件内容
tar -tzf pnce-1.0.0.tgz

# 删除临时文件
rm pnce-1.0.0.tgz
```

## 🐛 常见问题

### 问题 1: 包名已被占用

**解决方案：**
- 选择其他包名
- 或联系包的所有者协商

### 问题 2: 权限错误

**解决方案：**
```bash
# 退出当前账户
npm logout

# 重新登录
npm login
```

### 问题 3: 邮箱未验证

**解决方案：**
- 登录 npmjs.com
- 验证邮箱地址
- 重新发布

### 问题 4: 发布失败提示 "not allowed to publish"

**解决方案：**
- 确认已登录正确的账户
- 检查包名是否属于其他用户
- 如果是 scoped 包（如 @username/pnce），需要先创建 organization

## 📦 发布内容

发布到 npm 的文件（通过 `files` 字段控制）：

```
dist/
├── commands/
├── services/
├── types/
├── utils/
├── index.js
└── *.d.ts
README.md
```

**不会发布的文件：**
- src/（源码）
- node_modules/
- .git/
- tests/
- .env
- .DS_Store

## 🔄 更新发布

发布新版本时：

```bash
# 1. 更新版本号
npm version patch

# 2. 重新构建
npm run build

# 3. 发布
npm publish
```

## 📚 相关资源

- [npm 发布文档](https://docs.npmjs.com/packages-and-modules/publishing-packages)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [npm 包命名规范](https://docs.npmjs.com/cli/v9/using-npm/registry)

## 💡 最佳实践

1. **版本管理**：始终使用 `npm version` 命令更新版本号
2. **发布前测试**：使用 `npm link` 本地测试
3. **文档完善**：保持 README.md 更新
4. **变更日志**：维护 CHANGELOG.md
5. **安全性**：不要在包中包含敏感信息（API 密钥、密码等）
6. **依赖管理**：定期更新依赖，修复安全漏洞
