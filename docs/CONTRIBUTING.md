# 贡献指南

感谢你对 PNCE CLI 的关注和贡献！

本文档将帮助你了解如何参与 PNCE CLI 的开发。

## 行为准则

- 尊重所有贡献者
- 使用清晰和包容的语言
- 接受建设性的批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 如何贡献

### 报告 Bug

如果你发现 bug，请：

1. 先搜索 [Issues](https://github.com/hi-giacomo/pnce/issues) 确认是否已报告
2. 如果未报告，创建新的 Issue，包括：
   - 清晰的标题
   - 详细的问题描述
   - 重现步骤
   - 期望行为
   - 实际行为
   - 环境信息（Node.js 版本、操作系统、PNCE CLI 版本）
   - 错误日志（如果有）

### 提出新功能

如果你有新功能建议：

1. 先搜索 [Issues](https://github.com/hi-giacomo/pnce/issues) 确认是否已提出
2. 如果未提出，创建新的 Feature Request，包括：
   - 功能描述
   - 使用场景
   - 为什么这个功能很重要
   - 可能的实现方案（可选）

### 提交代码

#### 开发环境设置

```bash
# 1. Fork 仓库
# 在 GitHub 上点击 Fork 按钮

# 2. 克隆你的 fork
git clone https://github.com/你的用户名/pnce.git
cd pnce

# 3. 安装依赖
npm install

# 4. 构建项目
npm run build

# 5. 链接本地版本（可选）
npm link

# 6. 测试
pnce --version
pnce --help
```

#### 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/你的功能名
# 或
git checkout -b fix/你修复的问题
```

#### 编写代码

- 遵循现有的代码风格
- 添加必要的注释（特别是复杂的逻辑）
- 为公共 API 添加 JSDoc 注释
- 确保代码通过 TypeScript 编译（`npm run build`）

#### 测试

```bash
# 运行构建
npm run build

# 本地测试
npm link
pnce 测试命令

# 运行测试（如果有）
npm test
```

#### 提交代码

```bash
# 添加修改的文件
git add .

# 提交（使用清晰的提交信息）
git commit -m "feat: 添加批量安装功能"
# 或
git commit -m "fix: 修复 Token 过期检测问题"

# 提交类型:
# feat: 新功能
# fix: 错误修复
# docs: 文档更新
# style: 代码格式（不影响功能）
# refactor: 重构
# test: 测试相关
# chore: 构建或工具相关
```

#### 推送到你的 fork

```bash
git push origin feature/你的功能名
```

#### 创建 Pull Request

1. 在 GitHub 上访问你的 fork
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写 PR 模板：
   - 清晰的标题
   - 描述你的改动
   - 关联相关的 Issue（如果有）
   - 添加截图（如果适用）
   - 确认通过测试

## 代码规范

### TypeScript

- 使用 TypeScript 编写代码
- 遵循项目中的 `tsconfig.json` 配置
- 避免使用 `any` 类型
- 添加必要的类型定义

### 代码风格

- 使用 2 空格缩进
- 使用单引号（字符串）
- 在语句末尾使用分号
- 遵循现有的代码风格

### 命名规范

- 文件名：kebab-case（如 `auth.service.ts`）
- 类名：PascalCase（如 `AuthService`）
- 函数/变量：camelCase（如 `getUserInfo`）
- 常量：UPPER_SNAKE_CASE（如 `API_SERVER`）

### 注释规范

- 为所有公共方法添加 JSDoc 注释
- 为复杂逻辑添加行内注释
- 使用中文注释（因为是中文项目）

```typescript
/**
 * 获取用户信息
 * @param userId - 用户 ID
 * @returns 用户信息对象
 */
async function getUser(userId: string): Promise<UserInfo> {
  // 实现代码
}
```

## 文档

如果你的改动影响了用户可见的功能：

- 更新 README.md
- 更新 CHANGELOG.md（使用正确的格式）
- 更新相关的命令文档
- 添加使用示例

## 发布流程

PNCE CLI 使用语义化版本（Semantic Versioning）：

- **主版本号（MAJOR）**：不兼容的 API 修改
- **次版本号（MINOR）**：向下兼容的功能性新增
- **修订号（PATCH）**：向下兼容的问题修正

发布步骤（仅维护者）：

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 更新 CHANGELOG.md

# 3. 构建项目
npm run build

# 4. 测试
npm pack --dry-run

# 5. 发布
npm publish

# 6. 推送标签
git push --tags
```

## 社区

- GitHub: https://github.com/hi-giacomo/pnce
- Issues: https://github.com/hi-giacomo/pnce/issues
- Discussions: https://github.com/hi-giacomo/pnce/discussions

## 许可证

通过贡献代码，你同意你的贡献将在 [MulanPSL2](http://license.coscl.org.cn/MulanPSL2) 许可证下发布。

---

**感谢你的贡献！** 🎉
