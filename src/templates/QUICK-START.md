# 快速开始指南

## 🚀 2 步开始

### 步骤 1：选择包管理器

#### 使用 npm（简单稳定）
```bash
# 在主服务安装依赖
cd main
npm install

# 在微服务安装依赖
cd main/src/local_modules/microservice
npm install
```

#### 使用 pnpm（快速高效）
```bash
# 安装 pnpm
npm install -g pnpm

# 在主服务安装依赖
cd main
pnpm install

# 在微服务安装依赖
cd main/src/local_modules/microservice
pnpm install
```

### 步骤 2：完成！

就这么简单。所有依赖会自动安装到正确的位置。

---

## 📋 配置文件

### 主服务需要：

**package.json**:
```json
{
  "private": true,
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ]
}
```

**pnpm-workspace.yaml**（仅使用 pnpm 时需要）:
```yaml
packages:
  - 'src/local_modules/*'
  - 'src/external_modules/*'
```

### 微服务需要：

**package.json**:
```json
{
  "name": "microservice",
  "private": true
}
```

**不需要 workspaces 配置！**

---

## 🎯 推荐方案

| 场景 | 推荐方案 |
|--------|----------|
| 想要简单稳定 | npm |
| 想要快速高效 | pnpm |
| 不想安装额外工具 | npm |
| 愿意尝试新工具 | pnpm |
| 团队已经熟悉 npm | npm |
| 追求最佳性能 | pnpm |

---

## 💡 使用技巧

### 使用 npm

```bash
# 在任何目录安装依赖
npm install

# 添加新依赖
npm install package-name

# 运行脚本
npm run dev

# 查看依赖
npm ls
```

### 使用 pnpm

```bash
# 在任何目录安装依赖
pnpm install

# 添加新依赖
pnpm add package-name

# 运行脚本
pnpm run dev

# 查看依赖
pnpm ls
```

---

## ✨ 两种方案对比

| 特性 | npm | pnpm |
|------|-----|-------|
| 大众熟悉度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 安装速度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 磁盘占用 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 嵌套支持 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 学习成本 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎉 完成！

现在你可以：
- ✅ 在任何目录执行 `npm install`/`pnpm install` 都能正常工作
- ✅ 所有依赖自动提升到主服务的 `node_modules`
- ✅ 版本冲突自动处理
- ✅ 完全符合大众习惯

就这么简单！

---

## 📚 更多文档

- **完整文档**: [README.md](./README.md)
- **pnpm 详细**: [README-PNPM.md](./README-PNPM.md)
- **其他方案**: [README-ALTERNATIVES.md](./README-ALTERNATIVES.md)
- **配置示例**: [package-json-example.json](./package-json-example.json)
- **快速迁移**: [MIGRATION.md](./MIGRATION.md)
