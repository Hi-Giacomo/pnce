# 依赖管理方案 - 符合大众习惯

## 🎯 设计原则

1. **简单至上**：开发者不需要理解复杂的 workspace 机制
2. **符合习惯**：在任何目录执行 `yarn install` 都能正常工作
3. **自动优化**：尽可能共享依赖，节省空间
4. **无感知**：对开发者透明，无需额外配置

---

## 💡 推荐方案：使用 pnpm

### 为什么选择 pnpm？

| 特性 | yarn | npm | pnpm |
|------|------|-----|-------|
| 速度 | 快 | 慢 | 最快 |
| 磁盘占用 | 中 | 高 | 最低 |
| 嵌套 workspace | ❌ 不支持 | ⚠️ 有限制 | ✅ 完美支持 |
| 依赖提升 | 复杂 | 简单 | 智能 |
| 大众熟悉度 | ✅ 高 | ✅ 最高 | ⚠️ 中等 |

### pnpm 的优势

#### 1. **原生支持嵌套 workspace**
```json
{
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ]
}
```
- ✅ 自动识别所有层级的嵌套模块
- ✅ 依赖自动提升到主服务
- ✅ 版本冲突自动处理

#### 2. **智能依赖共享**
```
main/
  ├── node_modules/
  │   └── ... (所有依赖，使用硬链接)
  └── src/local_modules/
      └── microservice/
          └── node_modules/ (符号链接，指向主服务)
```

#### 3. **最快安装速度**
- 速度是 yarn 的 2-3 倍
- 比 npm 快 5-10 倍

#### 4. **最少磁盘占用**
- 使用硬链接共享依赖
- 磁盘占用比 yarn 少 50%+

### 使用方式

#### 安装 pnpm
```bash
npm install -g pnpm
# 或
npm install -D pnpm
```

#### 在主服务安装依赖
```bash
cd main
pnpm install  # 安装所有依赖
```

#### 在微服务安装依赖
```bash
cd main/src/local_modules/microservice
pnpm install  # 依赖自动提升到主服务
```

#### 安装新依赖
```bash
pnpm add package-name  # 在主服务添加依赖
```

---

## 📋 实施步骤

### 步骤 1：在项目中使用 pnpm

```bash
cd main
pnpm install
```

### 步骤 2：修改 package.json（可选）

如果要从 yarn 迁移到 pnpm：

```diff
{
  "scripts": {
-    "install": "yarn install",
+    "install": "pnpm install",
-    "add": "yarn add",
+    "add": "pnpm add",
  }
}
```

### 步骤 3：删除 yarn.lock

```bash
rm yarn.lock
pnpm install  # 生成 pnpm-lock.yaml
```

---

## 🔧 当前项目的 pnpm 配置

### 主服务 package.json
```json
{
  "name": "main",
  "private": true,
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ]
}
```

### 微服务 package.json
```json
{
  "name": "microservice",
  "version": "0.0.1",
  "private": true
  // 不需要 workspaces 配置
}
```

---

## 🎉 最终效果

### 使用 pnpm 后

✅ **在任何目录执行 `pnpm install` 都能正常工作**
✅ **所有依赖自动提升到主服务的 node_modules**
✅ **版本冲突自动处理，无感知**
✅ **安装速度最快，磁盘占用最少**
✅ **符合大众习惯，学习成本低**

### 依赖分布
```
main/
  ├── node_modules/              # 所有依赖（使用硬链接）
  │   ├── @nestjs/common/     # (共享)
  │   ├── @nestjs/core/       # (共享)
  │   └── ...               # (其他依赖)
  └── src/local_modules/
      └── microservice/
          └── node_modules/    # 符号链接（指向主服务）
```

---

## 🆚 pnpm vs yarn vs npm 对比

| 场景 | pnpm | yarn | npm |
|------|-------|------|-----|
| 在主服务安装依赖 | ✅ 快速，智能提升 | ✅ 需要配置 | ✅ 自动提升 |
| 在微服务安装依赖 | ✅ 自动提升 | ❌ 安装到本地 | ✅ 自动提升 |
| 嵌套微服务 | ✅ 完美支持 | ❌ 不支持 | ⚠️ 有限支持 |
| 依赖版本冲突 | ✅ 自动处理 | ❌ 需要手动处理 | ✅ 自动处理 |
| 磁盘空间 | ✅ 最少 | ⚠️ 较多 | ❌ 最多 |
| 安装速度 | ✅ 最快 | ⚠️ 快 | ❌ 慢 |

---

## 📝 总结

### 为什么选择 pnpm？

1. **最符合大众习惯**：`pnpm install` 和 `npm install` 用法完全一致
2. **原生支持嵌套**：无需额外配置或脚本
3. **性能最优**：速度最快，空间最少
4. **生态成熟**：活跃社区，完善文档
5. **迁移简单**：从 yarn 迁移只需几分钟

### 推荐使用

- **新项目**：直接使用 pnpm
- **现有项目**：从 yarn 迁移到 pnpm
- **特殊需求**：如果必须用 yarn，使用之前的 preinstall 脚本方案

### 常见问题

**Q: pnpm 兼容 npm/yarn 吗？**
A: 完全兼容。pnpm 使用 node_modules，与 npm/yarn 生态完全兼容。

**Q: 迁移到 pnpm 需要修改代码吗？**
A: 不需要。只需执行 `pnpm install` 替代 `npm/yarn install`。

**Q: 团队成员需要安装 pnpm 吗？**
A: 是的，但只需 `npm install -g pnpm`，非常简单。

**Q: CI/CD 需要配置吗？**
A: 大多数 CI/CD 工具原生支持 pnpm，或只需简单配置。

---

## 🚀 快速开始

```bash
# 1. 安装 pnpm
npm install -g pnpm

# 2. 在主服务安装依赖
cd main
pnpm install

# 3. 在微服务安装依赖
cd src/local_modules/microservice
pnpm install

# 完成！所有依赖已正确安装。
```

就这么简单！
