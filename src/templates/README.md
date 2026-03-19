# 依赖管理方案 - 支持任意深度嵌套

## 🎯 设计目标

1. **简单至上**：开发者不需要理解复杂的 workspace 机制
2. **符合习惯**：在任何目录执行 `yarn install` 都能正常工作
3. **智能查找**：自动找到最近的 service 或 microservice
4. **支持任意嵌套**：无论多少层嵌套都能正确工作

---

## 💡 核心方案：智能 preinstall 脚本

### 原理

1. **递归向上查找**：从当前目录查找最近的 `module.config.json`
2. **判断服务类型**：
   - `type === "service"` → 主服务，找到目标
   - `type === "microservice"` → 微服务，继续向上查找
3. **执行安装**：在找到的服务目录执行 `yarn install`
4. **依赖提升**：yarn workspace 自动处理依赖提升

### 优势

✅ **智能查找**：自动找到最近的服务（service 或 microservice）
✅ **支持任意嵌套**：无论多少层都能正确工作
✅ **符合大众习惯**：在任何目录执行 `yarn install`
✅ **无感知**：对开发者完全透明
✅ **简单可靠**：逻辑清晰，易于维护

---

## 🔧 配置方式

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
  "description": "Microservice module",
  "main": "dist/index.js",
  "private": true,
  "workspaces": [
    "src/local_modules/*",
    "src/external_modules/*"
  ],
  "scripts": {
    "preinstall": "node preinstall.js"
  }
}
```

### preinstall.js 脚本

```javascript
// 递归向上查找最近的服务（service 或 microservice）
function findNearestService(dir) {
  const moduleConfigPath = path.join(dir, 'module.config.json');

  if (fs.existsSync(moduleConfigPath)) {
    const config = JSON.parse(fs.readFileSync(moduleConfigPath, 'utf8'));

    // 找到 service 或 microservice
    if (config.type === 'service' || config.type === 'microservice') {
      return { dir, type: config.type };
    }
  }

  // 继续向上查找
  const parentDir = path.dirname(dir);
  if (parentDir === dir) return null;
  return findNearestService(parentDir);
}

// 执行 yarn install
const service = findNearestService(__dirname);
if (service) {
  const serviceType = service.type === 'service' ? '主服务' : '微服务';
  console.log(`📦 找到${serviceType} at: ${service.dir}`);

  process.chdir(service.dir);
  execSync('yarn install');
}
```

**详细说明**：参见 [PREINSTALL-LOGIC.md](./PREINSTALL-LOGIC.md)

---

## 📊 嵌套场景示例

### 场景 1：深层嵌套（5 层）

```
main/                                   (type: "service")
  └── src/local_modules/
      └── m1/                           (type: "microservice")
          └── src/local_modules/
              └── m2/                   (type: "microservice")
                  └── src/local_modules/
                      └── m3/           (type: "microservice")
                          └── src/local_modules/
                              └── m4/  ← 当前目录
                                  (type: "microservice")
```

**在 m4 中执行 `yarn install`**：

1. 查找最近的 service：
   - m4 → m3 (microservice) → 继续向上
   - m3 → m2 (microservice) → 继续向上
   - m2 → m1 (microservice) → 继续向上
   - m1 → main (service) → **找到主服务**

2. 在 main 中执行 `yarn install`：
   - 所有依赖安装到 `main/node_modules`
   - 版本冲突的包保留在各自目录

### 场景 2：没有主服务（孤立微服务）

```
temp/
  └── microservice/                       (type: "microservice")
      └── src/local_modules/
          └── sub-module/  ← 当前目录
              (type: "microservice")
```

**在 sub-module 中执行 `yarn install`**：

1. 查找最近的 service：
   - sub-module → microservice (service) → **找到目标**

2. 在 microservice 中执行 `yarn install`：
   - 所有依赖安装到 `microservice/node_modules`
   - 版本冲突的包保留在各自目录

### 场景 3：任意嵌套位置

```
main/                                   (type: "service")
  └── src/local_modules/
      └── module-a/                      (type: "microservice")
          └── external_modules/
              └── vendor-a/                 (type: "service")
                  └── node_modules/         ← 已有依赖
                      └── vendor-b/  ← 当前目录
                          (type: "microservice")
```

**在 vendor-b 中执行 `yarn install`**：

1. 查找最近的 service：
   - vendor-b → vendor-a (service) → **找到目标**

2. 在 vendor-a 中执行 `yarn install`：
   - vendor-a 的 workspaces 不包括 vendor-b
   - 依赖安装到 `vendor-a/node_modules`

---

## 🎉 最终效果

### 在任意目录执行 `yarn install`

✅ **自动找到最近的服务**（service 或 microservice）
✅ **依赖安装到正确的 node_modules**
✅ **版本冲突自动处理**
✅ **支持任意深度的嵌套**
✅ **完全符合大众习惯**

### 依赖提升规则

| 当前目录 | 目标服务 | 依赖位置 |
|----------|----------|----------|
| m4（深层嵌套） | main | `main/node_modules` |
| m3（深层嵌套） | m2 | `m2/node_modules` |
| m2（中层嵌套） | m1 | `m1/node_modules` |
| m1（最外层微服务） | main | `main/node_modules` |
| 独立微服务 | 微服务本身 | `microservice/node_modules` |

---

## 🚀 快速开始

### 使用方式

```bash
# 在任何目录执行 yarn install
cd main/src/local_modules/m1/src/local_modules/m2/src/local_modules/m3
yarn install

# 脚本会自动：
# 1. 查找最近的服务（main）
# 2. 在 main 中执行 yarn install
# 3. 依赖安装到 main/node_modules
```

### 依赖分布

```
main/
  ├── node_modules/          # 大部分依赖（共享）
  │   ├── @nestjs/common/
  │   ├── @nestjs/core/
  │   └── ... (其他依赖)
  └── src/local_modules/
      └── m1/
          ├── node_modules/  # 版本冲突的依赖
          │   └── @types/node@25.x
          └── src/local_modules/
              └── m2/
                  └── node_modules/  # 版本冲突的依赖
                  │   └── reflect-metadata@0.1.x
                  └── src/local_modules/
                      └── m3/
                          └── node_modules/  # 版本冲突的依赖
                              └── lodash@3.x
```

---

## 📋 配置要求

### 主服务

- ✅ 配置 `workspaces`
- ✅ 配置 `private: true`
- ✅ 可以有 `module.config.json`（type: "service"）

### 微服务

- ✅ 配置 `workspaces`（支持嵌套）
- ✅ 配置 `private: true`
- ✅ 必须有 `module.config.json`（type: "microservice"）
- ✅ 必须有 `preinstall.js` 脚本

---

## 📝 总结

### 核心优势

1. ✅ **智能查找**：自动找到最近的服务（service 或 microservice）
2. ✅ **支持任意嵌套**：无论多少层都能正确工作
3. ✅ **符合大众习惯**：在任何目录执行 `yarn install`
4. ✅ **无感知**：对开发者完全透明
5. ✅ **简单可靠**：逻辑清晰，易于维护

### 使用效果

在任何微服务中执行 `yarn install`，依赖会自动安装到**最近的服务**的 node_modules 中。

就这么简单！

---

## 📚 相关文档

- **Preinstall 逻辑**: [PREINSTALL-LOGIC.md](./PREINSTALL-LOGIC.md)
- **配置示例**: [package-json-example.json](./package-json-example.json)
- **快速开始**: [QUICK-START.md](./QUICK-START.md)
- **完整方案**: [FINAL-SOLUTION.md](./FINAL-SOLUTION.md)
