# 端口管理说明

## 🎯 设计目标

1. **自动分配**：创建或安装微服务时自动分配唯一端口号
2. **避免冲突**：确保端口不会被重复占用
3. **灵活配置**：支持手动指定端口或自动分配
4. **持久化存储**：端口信息保存在 `module.config.json` 中

---

## 🔧 工作原理

### 端口分配流程

1. **查找最近的服务**：递归向上查找最近的 service 或 microservice
2. **加载端口缓存**：从 `.pnce-port-cache.json` 加载已分配的端口
3. **检查已分配**：如果模块已有端口，直接使用
4. **查找可用端口**：从 3001 开始查找第一个可用的端口
5. **更新配置**：将端口写入 `module.config.json`
6. **保存缓存**：更新端口缓存文件

### 端口范围

- **起始端口**: 3001
- **最大端口**: 3999
- **可用端口**: 999 个

---

## 📋 使用方式

### 创建微服务（自动分配端口）

```bash
cd main
pnce init user-module -t microservice

# 输出：
# ✓ 分配端口: 3001 for user-module
# ✓ 已分配端口: 3001 for user-module
```

### 安装微服务（自动分配端口）

```bash
cd main
pnce install user-module

# 输出：
# ✓ 自动分配端口: 3002 for user-module
```

### 手动指定端口

```bash
cd main
pnce install user-module --port 5000

# 输出：
# ✓ module user-module PortConfigure 5000
```

### 查看已分配的端口

```bash
# 查看端口缓存
cat .pnce-port-cache.json

# 输出：
# {
#   "user-module": 3001,
#   "order-module": 3002,
#   "payment-module": 3003
# }
```

### 查看模块的端口

```bash
# 查看模块配置
cat user-service/src/local_modules/microservice/module.config.json

# 输出：
# {
#   "name": "microservice",
#   "port": 3001,
#   ...
# }
```

---

## 📊 配置文件

### module.config.json

微服务的 `module.config.json` 包含：

```json
{
  "name": "microservice",
  "version": "0.0.1",
  "description": "Microservice module",
  "author": "module-author",
  "type": "microservice",
  "appId": "",
  "teamId": "",
  "port": 3001
}
```

### .pnce-port-cache.json

端口缓存文件记录已分配的端口：

```json
{
  "user-module": 3001,
  "order-module": 3002,
  "payment-module": 3003
}
```

---

## 🎯 端口分配规则

### 自动分配规则

1. **检查缓存**：先检查端口缓存，如果模块已有端口，直接使用
2. **避免占用**：检查端口是否被系统占用（通过实际尝试绑定）
3. **递增分配**：从 3001 开始，查找第一个可用的端口
4. **记录缓存**：分配后更新端口缓存文件

### 端口冲突处理

- ✅ **系统占用**：自动跳过被占用的端口
- ✅ **已分配**：使用端口缓存中的记录
- ✅ **手动指定**：允许用户手动指定端口（不检查冲突）

---

## 🔄 环境变量配置

### 通过环境变量设置端口

```bash
# 在启动时设置端口
PORT=3001 npm run dev

# 或在 .env 文件中配置
echo "PORT=3001" >> .env
```

### 修改配置文件

```bash
# 修改 module.config.json
cat module.config.json | jq '.port = 3001' > module.config.json.tmp
mv module.config.json.tmp module.config.json
```

---

## 📝 使用场景

### 场景 1：嵌套微服务

```
main/                             (主服务)
  ├── .pnce-port-cache.json
  │   {
  │     "m1": 3001,
  │     "m2": 3002,
  │     "m3": 3003
  │   }
  └── src/local_modules/
      └── m1/
          ├── .pnce-port-cache.json
          │   {
          │     "m2": 3004,
          │     "m3": 3005
          │   }
          ├── module.config.json
          │   {
          │     "port": 3001
          │   }
          └── src/local_modules/
              └── m2/
                  ├── .pnce-port-cache.json
                  │   {
                  │     "m3": 3006
                  │   }
                  ├── module.config.json
                  │   {
                  │     "port": 3002
                  │   }
                  └── src/local_modules/
                      └── m3/
                          ├── module.config.json
                          │   {
                          │     "port": 3003
                          │   }
```

### 场景 2：独立微服务

```
standalone-microservice/
  ├── .pnce-port-cache.json
  │   {
  │     "module-a": 3001
  │   }
  └── module.config.json
      {
        "port": 3001
      }
```

---

## 🚀 快速开始

### 创建微服务并自动分配端口

```bash
cd main
pnce init user-module -t microservice

# 自动：
# 1. 创建微服务
# 2. 分配端口（3001）
# 3. 写入 module.config.json
# 4. 更新端口缓存
```

### 安装微服务并自动分配端口

```bash
cd main
pnce install user-module

# 自动：
# 1. 下载微服务
# 2. 分配端口（3002）
# 3. 写入 module.config.json
# 4. 更新端口缓存
```

### 手动指定端口

```bash
pnce install user-module --port 8080

# 手动：
# 1. 下载微服务
# 2. 设置端口为 8080
# 3. 写入 module.config.json
```

---

## ✅ 实现效果

✅ **自动分配端口**：创建或安装微服务时自动分配唯一端口
✅ **避免端口冲突**：自动检测端口占用，避免重复
✅ **支持任意嵌套**：无论多少层嵌套都能正确分配
✅ **灵活配置**：支持自动分配或手动指定
✅ **持久化存储**：端口信息保存在配置文件中

---

## 📚 相关文档

- **主文档**: [README.md](./README.md)
- **依赖管理**: [QUICK-START.md](./QUICK-START.md)
- **Preinstall 逻辑**: [PREINSTALL-LOGIC.md](./PREINSTALL-LOGIC.md)
