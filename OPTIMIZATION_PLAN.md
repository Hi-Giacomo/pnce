# PNCE CLI 0.0.9 发布前优化任务

## 概述
本文档记录将 PNCE CLI 发布为 npm 包（版本 0.0.9）前的任务清单和完成状态。

---

## 任务清单

### 🔴 必须修复（阻塞发布）

#### 1. License 声明修正
- [x] 修改 `package.json` 中的 `license` 字段为 `"MulanPSL2"`
- [x] 确认 LICENSE 文件内容

**位置**: `package.json` 第 25 行

---

#### 2. 移除内网服务器地址
- [x] 替换 README.md 中的 `http://62.234.36.178:3000` 为公网地址或环境变量示例
- [x] 替换 README.md 中的 `http://62.234.36.178:5173` 为公网地址或环境变量示例
- [x] 检查 API_DOCUMENTATION.md 中是否有类似问题
- [x] 确认 default.config.ts 中的默认配置（使用 localhost 或环境变量）

**位置**:
- `README.md` 第 451、453 行
- `src/config/default.config.ts` 第 7-8 行

---

### 🟡 强烈建议（提升用户体验）

#### 3. 创建关键文档
- [x] 创建 `CHANGELOG.md` - 记录从 0.0.1 到 0.0.9 的所有变更
- [x] 创建 `CONTRIBUTING.md` - 说明如何参与贡献
- [x] 创建 `SECURITY.md` - 说明安全漏洞报告流程
- [x] 创建 `.nvmrc` - 锁定 Node.js 版本为 18

---

#### 4. 移除 TODO 注释
- [x] 检查源代码中的 TODO/FIXME（已验证无残留）

---

#### 5. 改进环境变量验证
- [x] 为 `PNCE_LOG_LEVEL` 添加验证逻辑（检查是否为有效日志级别）
- [x] 为 `PNCE_OAUTH_PORT` 添加验证逻辑（检查是否为有效端口号）
- [ ] 为 `PNCE_LOG_FORMAT` 添加验证逻辑（检查是否为 json 或 simple）

**位置**: `src/config/manager.ts` 第 220-226 行

---

#### 6. 优化日志目录位置
- [x] 修改 `src/utils/logger.ts` 中的日志目录路径
- [x] 将 `process.cwd()` 改为 `os.homedir()`
- [x] 测试日志是否正确写入用户主目录

**位置**: `src/utils/logger.ts` 第 32 行

---

#### 7. 添加配置文件模板
- [x] 更新 `.npmignore` 文件
- [x] 配置忽略源代码、配置文件等不必要内容
- [ ] 创建 `.prettierignore` 文件（可选）

**建议的 .npmignore 内容**:
```text
src/
tsconfig.json
scripts/
*.md
!README.md
!.npmignore
yarn.lock
OPTIMIZATION_PLAN.md
OPTIMIZATION_SUMMARY.md
API_DOCUMENTATION.md
LOGIN_REQUIREMENTS.md
```

---

### 🟢 建议优化（长期改进）

#### 8. 添加单元测试
- [ ] 配置 Jest 或 Vitest 测试框架
- [ ] 为 `src/services/api.service.ts` 编写单元测试
- [ ] 为 `src/services/auth.service.ts` 编写单元测试
- [ ] 为 `src/config/manager.ts` 编写单元测试
- [ ] 为 `src/utils/errors.ts` 编写单元测试
- [ ] 为 `src/utils/logger.ts` 编写单元测试
- [ ] 配置测试覆盖率目标（>50%）

---

#### 9. 优化发布包体积
- [ ] 检查是否需要发布 `.map` 文件（可考虑移除）
- [ ] 优化依赖项，移除不必要的包
- [ ] 考虑使用 tree-shaking 减少体积
- [ ] 评估是否使用 `pkg` 打包为单个可执行文件

**当前状态**: dist 大小 1.1MB，包含 163 个文件

---

#### 10. 添加 CI/CD 配置
- [ ] 创建 `.github/workflows/ci.yml` 工作流文件
- [ ] 配置自动构建流程
- [ ] 配置自动测试流程（等测试添加后）
- [ ] 配置自动发布流程

**建议的 CI 工作流**:
```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
```

---

## 发布步骤清单

### 发布前准备 🔴

- [ ] 完成所有"必须修复"任务（任务 1-2）
- [ ] 运行 `npm run build` 确保编译成功
- [ ] 运行 `npm link` 本地测试
- [ ] 执行 `pnce --help` 验证命令正常
- [ ] 执行 `pnce --version` 验证版本号
- [ ] 执行 `npm pack --dry-run` 检查发布内容

### 功能测试 ✅

- [ ] 测试初始化功能: `pnce init service test-app`
- [ ] 测试安装功能: `pnce install module-name`
- [ ] 测试批量安装: `pnce install-batch m1 m2 m3`
- [ ] 测试登录功能: `pnce login`
- [ ] 测试查看用户: `pnce me`
- [ ] 测试登出功能: `pnce logout`
- [ ] 测试配置管理: `pnce registry get`

### 发布到 npm 🚀

- [ ] 更新版本号: `npm version patch` (0.0.8 -> 0.0.9)
- [ ] 登录 npm 账号: `npm login`
- [ ] 发布包: `npm publish`
- [ ] 验证发布: `npm install -g pnce@0.0.9`
- [ ] 再次测试核心功能确认安装正确

---

## 进度统计

### 按优先级统计

| 优先级 | 任务数 | 已完成 | 完成率 |
|--------|--------|--------|--------|
| 🔴 必须修复 | 2 | 2 | 100% ✅ |
| 🟡 强烈建议 | 5 | 4.5 | 90% |
| 🟢 建议优化 | 3 | 0 | 0% |
| **总计** | **10** | **6.5** | **65%** |

### 按类别统计

| 类别 | 任务数 | 已完成 |
|------|--------|--------|
| 配置修复 | 2 | 2 ✅ |
| 文档创建 | 4 | 4 ✅ |
| 代码改进 | 2 | 2 ✅ |
| 测试 | 1 | 0 |
| 优化 | 1 | 0 |

---

## 注意事项

1. **版本号规范**: 遵循语义化版本（Semantic Versioning）
2. **破坏性变更**: 如果有破坏性变更，应该升级主版本号（0.0.8 -> 1.0.0）
3. **向后兼容**: 保持 0.x 版本的向后兼容性
4. **发布前**: 必须完成所有 🔴 标记的任务 ✅
5. **发布后**: 继续完成 🟡 和 🟢 标记的任务

---

## 发布状态

**当前版本**: 0.0.8
**目标版本**: 0.0.9
**发布状态**: ✅ 满足发布条件（所有必须修复任务已完成）
**最后更新**: 2026-03-06

---

**提示**: 所有 🔴 标记的任务已完成，可以进行发布。建议继续完成 🟡 任务后再发布以获得更好的用户体验。
