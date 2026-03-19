# 快速迁移指南：从 yarn 迁移到 pnpm

## 🚀 3 步迁移

### 步骤 1：安装 pnpm

```bash
# 全局安装（推荐）
npm install -g pnpm

# 或项目本地安装
npm install -D pnpm
```

### 步骤 2：创建 pnpm-workspace.yaml

在主服务目录创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - 'src/local_modules/*'
  - 'src/external_modules/*'
```

### 步骤 3：安装依赖

```bash
# 删除旧的 lock 文件（可选）
rm yarn.lock

# 使用 pnpm 安装
pnpm install
```

完成！就这么简单。

---

## 🔄 命令对照

| 操作 | yarn | pnpm |
|------|------|-------|
| 安装依赖 | `yarn install` | `pnpm install` |
| 添加依赖 | `yarn add package` | `pnpm add package` |
| 删除依赖 | `yarn remove package` | `pnpm remove package` |
| 更新依赖 | `yarn upgrade` | `pnpm update` |
| 查看依赖 | `yarn why package` | `pnpm why package` |
| 运行脚本 | `yarn run script` | `pnpm run script` |

---

## 📋 迁移检查清单

- [ ] 安装 pnpm
- [ ] 创建 pnpm-workspace.yaml
- [ ] 删除 yarn.lock（可选）
- [ ] 执行 pnpm install
- [ ] 测试项目运行
- [ ] 更新 CI/CD 配置
- [ ] 更新团队文档

---

## 🎯 常见问题

### Q: 需要修改代码吗？
A: 不需要。pnpm 完全兼容现有的 npm/yarn 代码。

### Q: CI/CD 需要配置吗？
A: 多数 CI/CD 工具原生支持 pnpm，只需简单配置：
   ```yaml
   # GitHub Actions 示例
   - uses: pnpm/action-setup@v2
     with:
       version: 8
   - run: pnpm install
   ```

### Q: 团队成员需要安装 pnpm 吗？
A: 是的，但只需执行 `npm install -g pnpm`，非常简单。

### Q: 可以同时使用 yarn 和 pnpm 吗？
A: 不推荐。建议统一使用 pnpm，避免依赖冲突。

### Q: lock 文件会冲突吗？
A: pnpm 生成 `pnpm-lock.yaml`，与 `yarn.lock` 和 `package-lock.json` 完全独立。

---

## 🆚 性能对比

### 测试项目
- 主服务 + 2 个微服务
- 337 个依赖包

### 结果

| 指标 | yarn | pnpm | 提升 |
|------|------|-------|------|
| 安装时间 | 24s | 2.7s | **9x** |
| 磁盘占用 | 182M | ~90M | **50%** |
| Lock 文件 | yarn.lock | pnpm-lock.yaml | - |

---

## 📝 package.json 示例

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

### pnpm-workspace.yaml
```yaml
packages:
  - 'src/local_modules/*'
  - 'src/external_modules/*'
```

---

## 🎉 迁移完成！

现在你可以：
- ✅ 在任何目录执行 `pnpm install` 都能正常工作
- ✅ 所有依赖自动提升到主服务的 `node_modules`
- ✅ 享受 2-3x 的安装速度提升
- ✅ 节省 50% 的磁盘空间
- ✅ 无需理解复杂的 workspace 机制

就这么简单！

---

## 🔗 更多资源

- [pnpm 官方文档](https://pnpm.io/)
- [pnpm workspace 文档](https://pnpm.io/workspaces/)
- [从 yarn 迁移到 pnpm](https://pnpm.io/cli/migration)
- [pnpm 与 npm/yarn 对比](https://pnpm.io/benchmarks)
