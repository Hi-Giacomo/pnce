# Preinstall 逻辑说明

## 🎯 设计目标

当在任意深度的嵌套微服务中执行 `yarn install` 时，依赖会安装到**最近的上层服务**的 node_modules 中。

---

## 📋 工作原理

### 查找最近的服务

递归向上查找最近的服务（`type: "service"` 或 `type: "microservice"`）：

1. **检查当前目录**是否有 `module.config.json`
2. **读取配置**，检查 `type` 字段
3. **判断服务类型**：
   - `type === "service"` → 主服务，找到目标
   - `type === "microservice"` → 微服务，继续向上查找
4. **递归向上查找**，直到找到主服务或到达根目录

### 执行安装

找到目标服务后：
- 切换到目标服务目录
- 在该目录执行 `yarn install`
- yarn workspace 会自动处理依赖提升

---

## 📊 场景示例

### 场景 1：嵌套 3 层

```
main/                           (type: "service", 主服务)
  └── src/local_modules/
      └── m1/              (type: "microservice")
          └── src/local_modules/
              └── m2/          (type: "microservice")
                  └── src/local_modules/
                      └── m3/   ← 当前目录
                          (type: "microservice")
```

**在 m3 中执行 `yarn install`**:

1. 查找最近的 service：
   - m3 → module.config.json → type: "microservice"
   - 继续向上 → m2 → module.config.json → type: "microservice"
   - 继续向上 → m1 → module.config.json → type: "microservice"
   - **找到 m1（微服务）**

2. 在 m1 中执行 `yarn install`：
   - m1 的 workspaces: `["src/local_modules/*"]`
   - 识别 m2 作为 workspace
   - 依赖安装到 `m1/node_modules`

### 场景 2：直接在主服务

```
main/                           (type: "service", 主服务)
  └── src/local_modules/
      └── m1/              (type: "microservice")
          └── src/local_modules/
              └── m2/          (type: "microservice")
```

**在 main 中执行 `yarn install`**:

1. 找到主服务（当前目录）
2. 在 main 中执行 `yarn install`
3. 依赖安装到 `main/node_modules`

### 场景 3：在嵌套微服务中

```
main/                           (type: "service", 主服务)
  └── src/local_modules/
      └── m1/              (type: "microservice")
          └── src/local_modules/
              └── m2/          (type: "microservice")
                  └── node_modules/
                      └── @types/node@25.x  ← 当前目录
```

**在 m2 中执行 `yarn install`**:

1. 查找最近的 service：
   - m2 → module.config.json → type: "microservice"
   - 继续向上 → m1 → module.config.json → type: "microservice"
   - **找到 m1（微服务）**

2. 在 m1 中执行 `yarn install`：
   - m2 的 `node_modules/@types/node@25.x` 已经存在
   - 不会重复安装
   - 其他依赖安装到 `m1/node_modules`

---

## 🔧 实现细节

### preinstall.js 脚本

```javascript
// 递归向上查找最近的服务
function findNearestService(dir) {
  const moduleConfigPath = path.join(dir, 'module.config.json');

  if (fs.existsSync(moduleConfigPath)) {
    const config = JSON.parse(fs.readFileSync(moduleConfigPath, 'utf8'));

    // 找到服务（service 或 microservice）
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

### 微服务 package.json

```json
{
  "name": "microservice",
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

**关键点**：
- `workspaces` 配置：让微服务也能管理自己的嵌套服务
- `preinstall` 脚本：查找最近的服务并跳转
- `private: true`：确保不会意外发布

---

## 🎉 最终效果

✅ **智能查找最近的服务**：自动找到最近的 service 或 microservice
✅ **依赖安装到正确的位置**：最近服务的 node_modules
✅ **版本冲突自动处理**：yarn workspace 自动处理
✅ **支持任意深度嵌套**：无论多少层都能正确工作
✅ **完全符合大众习惯**：在任何目录执行 `yarn install`

---

## 📝 总结

### 核心逻辑

1. **递归向上查找**：从当前目录向上查找最近的 service 或 microservice
2. **判断服务类型**：
   - `type: "service"` → 主服务，找到目标
   - `type: "microservice"` → 继续向上查找
3. **执行安装**：在目标服务目录执行 `yarn install`
4. **依赖提升**：yarn workspace 自动处理

### 优势

✅ **简单直观**：逻辑清晰，易于理解和维护
✅ **支持任意嵌套**：无论多少层都能正确工作
✅ **自动版本处理**：yarn workspace 自动处理版本冲突
✅ **完全大众习惯**：无需理解复杂的 workspace 机制

---

## 🚀 快速测试

### 测试脚本
```bash
node /path/to/temp/test-preinstall.js
```

### 测试各个目录
```bash
# 测试 m3 → 应该找到 m2
cd m3/src/local_modules/m3 && node preinstall.js

# 测试 m2 → 应该找到 m1
cd m2 && node preinstall.js

# 测试 m1 → 应该找到 main
cd m1 && node preinstall.js

# 测试 main → 应该找到 main
cd main && node preinstall.js
```

就这么简单！
