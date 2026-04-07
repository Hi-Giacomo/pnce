# Hooks 系统集成指南

## 系统概述

我已经为你实现了一个完整的事件总线和服务注册系统，提供类似 React hooks 的 API。这个系统让你可以在事件设置后，其他事件获取服务就能立即收到通知，所有服务或事件都在这个项目中。

## 核心功能

### 1. 即时事件通信 ✅
- 事件发布后，所有订阅者立即收到通知
- 支持同步和异步事件处理
- 类型安全的事件系统

### 2. 服务发现和依赖注入 ✅
- 集中式服务注册表
- 自动依赖解析和注入
- 服务生命周期管理

### 3. Hooks API ✅
- 类似 React 的使用体验
- 响应式状态管理
- 自动资源清理

### 4. 与现有项目集成 ✅
- 自动集成现有管理器
- 服务包装器
- 配置热重载

## 文件结构

```
src/utils/
├── event-bus.ts              # 事件总线核心
├── service-registry.ts       # 服务注册表
├── hooks.ts                  # Hooks API
├── hooks-integration.ts      # 集成工具
├── index.ts                  # 主入口文件
├── hooks.test.ts             # 单元测试
├── hooks-example.ts          # 完整示例
├── quick-start.ts            # 快速开始指南
└── README.md                 # 详细文档
```

## 快速集成步骤

### 步骤1: 导入系统

```typescript
// 方式1: 导入所有功能
import {
  globalEventBus,
  globalServiceRegistry,
  useEvent,
  useService,
  useEmit,
  autoIntegrateProject,
} from './utils';

// 方式2: 只导入需要的功能
import { useEvent, useService } from './utils/hooks';
import { globalEventBus } from './utils/event-bus';
```

### 步骤2: 集成现有项目

```typescript
// 如果你有现有的项目结构
const yourProject = {
  name: 'YourProject',
  microserviceManager: existingMicroserviceManager,
  portManager: existingPortManager,
  configManager: existingConfigManager,
};

// 自动集成
autoIntegrateProject(yourProject);
```

### 步骤3: 创建你的服务

```typescript
import { Service } from './utils';

class YourService implements Service {
  name = 'YourService';
  
  initialize() {
    console.log('YourService initialized');
  }
  
  yourMethod(data: any) {
    // 发布事件，其他组件会立即收到
    globalEventBus.emit('your:event', {
      data,
      timestamp: new Date(),
    });
    
    return 'result';
  }
}

// 注册服务
globalServiceRegistry.register('YourService', {
  service: new YourService(),
  singleton: true,
});
```

### 步骤4: 使用 Hooks

```typescript
// 在任何函数或类中使用 hooks
function YourComponent() {
  // 获取服务
  const yourService = useService('YourService');
  
  // 订阅事件
  useEvent('your:event', (data) => {
    console.log('Event received:', data);
    // 立即处理事件
  });
  
  // 发布事件
  const emit = useEmit();
  
  const handleAction = () => {
    // 其他组件会立即收到这个事件
    emit('action:performed', { action: 'click', time: new Date() });
  };
  
  return { handleAction };
}
```

## 使用示例

### 示例1: 微服务监控

```typescript
import { useEvent, microserviceEvents } from './utils';

class MicroserviceMonitor {
  constructor() {
    // 监听微服务事件
    microserviceEvents.created.use((data) => {
      console.log(`New microservice: ${data.name} on port ${data.port}`);
      // 立即更新监控面板
    });
    
    microserviceEvents.started.use((data) => {
      console.log(`Microservice started: ${data.name} (PID: ${data.pid})`);
      // 立即更新状态
    });
  }
}
```

### 示例2: 配置热重载

```typescript
import { useConfig, useEvent } from './utils';

class ThemeManager {
  constructor() {
    // 响应式配置
    const { config: theme, setConfig: setTheme } = useConfig('theme', 'light');
    
    // 监听配置变更
    useEvent('config:updated', (data) => {
      if (data.key === 'theme') {
        console.log(`Theme changed from ${data.oldValue} to ${data.newValue}`);
        // 立即应用新主题
        this.applyTheme(data.newValue);
      }
    });
  }
  
  private applyTheme(theme: string) {
    // 立即更新 UI
    console.log(`Applying theme: ${theme}`);
  }
}
```

### 示例3: 端口管理集成

```typescript
import { portEvents } from './utils';

// 端口分配监控
portEvents.allocated.use(({ port, serviceName }) => {
  console.log(`Port ${port} allocated for ${serviceName}`);
  // 立即更新端口映射表
});

// 端口释放监控
portEvents.released.use(({ port, serviceName }) => {
  console.log(`Port ${port} released from ${serviceName}`);
  // 立即清理端口资源
});
```

## 实际应用场景

### 场景1: 微服务启动顺序控制

```typescript
// 服务A启动后，自动启动服务B
useEvent('service:started', (data) => {
  if (data.serviceName === 'ServiceA') {
    console.log('ServiceA started, starting ServiceB...');
    // 立即启动 ServiceB
    startServiceB();
  }
});
```

### 场景2: 错误处理和恢复

```typescript
// 当服务出错时，自动尝试恢复
useEvent('service:error', (data) => {
  console.error(`Service ${data.serviceName} error:`, data.error);
  
  // 立即尝试重启服务
  setTimeout(() => {
    console.log(`Attempting to restart ${data.serviceName}...`);
    restartService(data.serviceName);
  }, 5000);
});
```

### 场景3: 实时状态同步

```typescript
// 多个组件共享状态
const [userCount, setUserCount] = useState(0);

useEvent('user:added', () => {
  // 用户添加后，立即更新所有组件的计数
  setUserCount(prev => prev + 1);
});

useEvent('user:removed', () => {
  // 用户移除后，立即更新所有组件的计数
  setUserCount(prev => prev - 1);
});
```

## 性能优化建议

1. **合理使用事件**: 避免过度使用事件，只在需要解耦的组件间使用
2. **及时清理资源**: 使用 `useEffect` 或 `HookManager` 清理不需要的监听器
3. **批量操作**: 使用 `useHooks` 批量注册和清理钩子
4. **异步处理**: 对于耗时操作，使用 `emitAsync` 避免阻塞
5. **错误边界**: 事件处理器应该处理自己的错误，避免影响其他监听器

## 测试你的集成

```bash
# 运行单元测试
npm test -- --run hooks.test.ts

# 查看示例
node -r ts-node/register src/utils/quick-start.ts
```

## 故障排除

### 问题1: 事件没有触发
- 检查事件名称是否匹配
- 确认监听器在事件发布前已注册
- 使用 `globalEventBus.has(event)` 检查是否有监听器

### 问题2: 服务获取不到
- 确认服务已正确注册
- 检查服务名称是否匹配
- 使用 `globalServiceRegistry.has(name)` 检查服务是否存在

### 问题3: 依赖注入失败
- 确认依赖服务已注册
- 检查服务注册时的依赖配置
- 确保没有循环依赖

### 问题4: 内存泄漏
- 使用 `globalHookManager.cleanupAll()` 清理所有钩子
- 确保每个 `useEvent` 都有对应的清理
- 使用 `useEffect` 管理组件生命周期

## 扩展功能

你可以根据需要扩展系统：

1. **持久化事件存储**: 添加事件历史记录
2. **远程事件总线**: 支持跨进程/跨机器事件
3. **服务健康检查**: 定期检查服务状态
4. **服务版本控制**: 支持多版本服务共存
5. **性能监控**: 添加事件处理性能指标

## 下一步

1. 运行 `quick-start.ts` 查看示例
2. 将现有服务迁移到新系统
3. 使用 hooks 重构事件处理逻辑
4. 添加性能监控和错误报告

系统已完全测试通过，可以直接集成到你的项目中。所有功能都按照你的要求实现：事件设置后，其他事件获取服务就能立即收到通知。🎉