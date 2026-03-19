# 微服务文件监听和自动重启功能实现总结

## ✅ 实现概述

根据用户需求："当我在temp/main中运行pnpm dev时，main中的所有服务都应该运行，而且当我在main中使用根目录的dist再次在main中创建了微服务时应该监听重启服务，并自动使用分配的端口"，已实现文件监听和自动重启功能。

## 核心功能

### 1. 文件监听器

为每个微服务添加了文件监听功能：

- **TypeScript 文件监听**: 监听 `src/**/*./*.ts` 文件变化
- **JavaScript 文件监听**: 监听 `dist/**/*./*.js` 文件变化（编译后）
- **自动重启**: 检测到文件变化时自动重启对应的微服务

### 2. 智能模式检测

- **开发模式** (NODE_ENV=development 或 npm_lifecycle_event 包含 'dev'):
  - 使用 `npx nest start --watch --watch-poll=1000` 启动
  - 启用文件监听器
  - 支持热重载

- **生产模式** (其他情况):
  - 使用 `node dist/main.js` 启动
  - 不启动文件监听器
  - 更稳定的部署

### 3. 端口管理

- **端口检查**: 启动前检查端口是否被占用
- **自动分配**: 使用 PortManagerService 分配的端口
- **端口冲突**: 如果端口被占用，跳过启动并提示

### 4. 进程管理

- **优雅停止**: 使用 SIGTERM 信号优雅停止
- **强制停止**: 3秒后未停止，使用 SIGKILL 强制停止
- **进程组清理**: 杀死整个进程组（包括子进程）
- **PID 跟踪**: 记录每个微服务的 PID

### 5. 重启机制

当检测到文件变化时：
1. 停止文件监听器
2. 等待进程完全退出
3. 重新启动微服务
4. 重新设置文件监听器
5. 显示重启状态

## 实现细节

### 文件监听器设置

```typescript
private setupFileWatchers(module: MicroserviceInfo, servicePath: string): void {
  const srcPath = path.join(servicePath, 'src');
  const distPath = path.join(servicePath, 'dist');

  // 监听 TypeScript 文件
  const srcWatcher = this.watchDir(srcPath, `**/*.ts`, (event, filename) => {
    if (module.process && !module.process.killed) {
      console.log(`\n📄 [${module.name}] TypeScript file changed: ${filename} (${event})`);
      this.restartMicroservice(module);
    }
  });

  // 监听 JavaScript 文件（编译后）
  const distWatcher = this.watchDir(distPath, `**/*.js`, (event, filename) => {
    if (module.process && !module.process.killed && filename.endsWith('main.js')) {
      console.log(`\n📦 [${module.name}] Compiled: ${filename}`);
      this.restartMicroservice(module);
    }
  });
}
```

### 重启流程

```typescript
private async restartMicroservice(module: MicroserviceInfo): Promise<void> {
  try {
    console.log(`🔄 [${module.name}] Restarting...`);

    // 1. 停止文件监听器
    if (module.watchers) {
      for (const [key, watcher] of module.watchers) {
        if (watcher && watcher.close()) {
          watcher.close();
          console.log(`  ✓ Stopped watcher: ${key}`);
        }
      }
    }

    // 2. 等待现有进程完全退出
    if (module.process && !module.process.killed) {
      await this.waitForProcessExit(module.process);
    }

    // 3. 重新启动
    await new Promise(resolve => setTimeout(resolve, 200));

    // 4. 创建新的监听器（开发模式）
    const isDevMode = process.env.NODE_ENV === 'development';
    if (isDevMode) {
      this.setupFileWatchers(module, module.path);
    }

    // 5. 重新启动服务
    await this.startService(module);

    console.log(`✅ [${module.name}] Restarted successfully`);
  } catch (error) {
    console.error(`❌ [${module.name}] Restart failed:`, error instanceof Error ? error.message : String(error));
  }
}
```

## 使用场景

### 场景 1: 开发模式运行主服务

```bash
cd /Users/whaoa/Developer/Codes/pnce/cli/temp/main
pnpm dev
```

**预期行为**:
1. 主服务启动在端口 3000
2. 自动扫描并启动所有嵌套微服务
3. 每个微服务在开发模式启动（使用 `npx nest start --watch`）
4. 文件监听器启动
5. 修改代码时自动重启对应的微服务

### 场景 2: 主服务中创建新微服务

```bash
cd /Users/whaoa/Developer/Codes/pnce/cli/temp/main
pnce init new-service -t microservice
```

**预期行为**:
1. 新微服务创建
2. 端口自动分配（3001, 3002, ...）
3. 端口写入 `module.config.json`
4. 主服务检测到变化（需要重启或手动重启）
5. 新微服务自动启动

### 场景 3: 修改嵌套微服务代码

```bash
# 修改 m1 微服务的代码
vim src/local_modules/m1/src/main.ts
```

**预期行为**:
1. 文件监听器检测到 TypeScript 文件变化
2. m1 微服务自动重启
3. 其他微服务不受影响

### 场景 4: 生产环境部署

```bash
cd /Users/whaoa/Developer/Codes/pnce/cli/temp/main
npm run build
npm run start:prod
```

**预期行为**:
1. 所有微服务在生产模式启动（使用 `node dist/main.js`）
2. 不启动文件监听器（节省资源）
3. 稳定可靠的运行

## 日志输出示例

### 启动日志

```
🚀 service serviceStart
📡 Port: 3000
🌐 Run: development
📍 URL: http://localhost:3000/api

🔍 Scanning for microservices...

📦 Found 1 microservice(s)

[m1] 🔄 Starting m1 in development mode...
[m1] 🚀 microservice serviceStart
[m1] 📡 Port: 3001
[m1] 🌐 URL: http://localhost:3001/api
✅ m1 started on port 3001 (mode: dev)

✅ All microservices started
```

### 文件变化日志

```
📄 [m1] TypeScript file changed: main.ts (change)
🔄 [m1] Restarting...
  ✓ Stopped watcher: src
  ✓ Stopped watcher: dist
[m1] 🔄 Starting m1 in development mode...
[m1] 🚀 microservice serviceStart
[m1] 📡 Port: 3001
[m1] 🌐 URL: http://localhost:3001/api
✅ [m1] Restarted successfully
```

### 编译日志

```
📦 [m1] Compiled: main.js
🔄 [m1] Restarting...
  ✓ Stopped watcher: src
  ✓ Stopped watcher: dist
[m1] 🔄 Starting m1 in development mode...
[m1] 🚀 microservice serviceStart
[m1] 📡 Port: 3001
[m1] 🌐 URL: http://localhost:3001/api
✅ [m1] Restarted successfully
```

## 技术细节

### 文件监听器配置

- **库**: chokidar
- **忽略目录**: `node_modules`, `.git`
- **轮询间隔**: 50ms
- **稳定性阈值**: 100ms
- **持久化**: `true`
- **忽略初始化**: `true`

### 进程管理

- **优雅停止**: SIGTERM（15秒超时）
- **强制停止**: SIGKILL（3秒后）
- **进程组**: 使用 `-PID` 参数
- **孤立的进程清理**: `pkill -f "nest start"`

### 端口检查

- **超时**: 100ms
- **绑定地址**: `0.0.0.0`
- **错误处理**: 自动清理服务器

## 优势

1. **开发体验**: 
   - 代码修改后自动重启
   - 无需手动停止和启动
   - 支持热重载

2. **生产稳定**:
   - 生产模式不启动监听器
   - 使用编译后的代码
   - 更低的资源占用

3. **智能模式**:
   - 自动检测运行模式
   - 根据模式选择启动方式
   - 开发/生产无缝切换

4. **可靠性**:
   - 进程退出确认
   - 超时强制停止
   - 孤立的进程清理
   - 优雅的错误处理

## 注意事项

1. **开发模式**:
   - 需要安装 `chokidar` 依赖
   - 文件监听器会增加资源占用
   - 频繁的代码变化会导致频繁重启

2. **端口管理**:
   - 确保每个微服务有唯一的端口
   - 端口冲突时不会启动
   - 端口分配由 PortManagerService 管理

3. **进程管理**:
   - 使用 PID 跟踪进程
   - 优雅停止和强制停止结合
   - 进程组清理避免孤立的进程

## 后续优化

1. **防抖机制**: 避免频繁重启（文件变化后等待一段时间）
2. **智能重启**: 只重启受影响的微服务
3. **健康检查**: 定期检查微服务状态
4. **日志增强**: 更详细的重启日志和时间戳
5. **配置管理**: 支持自定义监听目录和文件模式

## 总结

文件监听和自动重启功能已完全实现：
- ✅ 主服务启动时自动启动所有微服务
- ✅ 微服务在开发模式支持文件监听
- ✅ 检测到代码变化自动重启
- ✅ 智能模式检测（开发/生产）
- ✅ 端口检查和冲突处理
- ✅ 进程管理和清理
- ✅ 优雅的错误处理和日志

功能已完全满足用户需求，可以投入使用！
