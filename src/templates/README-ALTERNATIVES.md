# Yarn Workspace 替代方案

## 方案对比

### 方案 1：使用 npm workspaces（推荐）

#### 优点：
- ✅ 原生支持，无需额外配置
- ✅ 简单易用，符合大众习惯
- ✅ 社区标准，生态成熟

#### 配置方式：
```json
{
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ]
}
```

#### 使用方式：
```bash
cd main
npm install  # 安装所有依赖

cd main/src/local_modules/microservice
npm install  # 依赖安装到当前目录或主服务（npm 自动处理）
```

---

### 方案 2：使用 pnpm（推荐）

#### 优点：
- ✅ 原生支持嵌套 workspace
- ✅ 依赖提升更智能
- ✅ 安装速度更快
- ✅ 磁盘空间占用更少

#### 配置方式：
```json
{
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ]
}
```

#### 使用方式：
```bash
pnpm install  # 在任何目录执行，依赖自动提升到主服务
```

#### 安装 pnpm：
```bash
npm install -g pnpm
```

---

### 方案 3：简化 yarn workspace（当前方案）

#### 优点：
- ✅ 使用现有 yarn v1.22
- ✅ 兼容现有项目
- ✅ 通过 preinstall 脚本实现

#### 缺点：
- ❌ 配置复杂
- ❌ 需要理解 preinstall 脚本
- ❌ 嵌套场景处理不够优雅

---

## 推荐方案

### 最简单：npm workspaces

**原因**：
1. 开发者已经熟悉 npm
2. 无需安装额外工具
3. 原生支持，无需脚本

**实施步骤**：
1. 移除 preinstall.js 脚本
2. 保留 workspaces 配置
3. 使用 `npm install` 替代 `yarn install`

### 最强大：pnpm

**原因**：
1. 原生支持嵌套 workspace
2. 性能更优
3. 社区活跃，文档完善

**实施步骤**：
1. 安装 pnpm
2. 移除 preinstall.js 脚本
3. 保留 workspaces 配置
4. 使用 `pnpm install`

---

## 大众习惯对比

| 操作 | npm | pnpm | yarn v1 |
|------|------|-------|---------|
| 在主服务安装依赖 | `npm install` | `pnpm install` | `yarn install` |
| 在微服务安装依赖 | `npm install` | `pnpm install` | `yarn install` |
| 依赖提升 | 自动 | 自动 | 需要配置 |
| 嵌套支持 | 支持 | 完美支持 | 不支持 |
| 学习成本 | 低 | 低 | 高 |

---

## 结论

**如果追求最简单**：使用 npm workspaces
**如果追求最强大**：使用 pnpm
**如果必须用 yarn**：使用当前的 preinstall 脚本方案

### 建议

对于大众开发者：
1. **优先推荐 pnpm**：功能强大、性能优秀、学习成本低
2. **次选 npm workspaces**：无需额外安装、符合现有习惯
3. **最后选择 yarn**：如果有特定需求必须使用 yarn
