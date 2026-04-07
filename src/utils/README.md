# Hooks 系统

一个轻量级、类型安全的事件总线和服务注册系统，提供类似 React hooks 的 API，让服务之间可以即时通信。

## 功能特性

- 🚀 **事件总线**：支持发布-订阅模式，类型安全的事件系统
- 🔧 **服务注册表**：服务发现、依赖注入和生命周期管理
- ⚡ **Hooks API**：类似 React hooks 的 API，易于使用
- 🎯 **类型安全**：完整的 TypeScript 支持
- 🔌 **易于集成**：提供集成工具，可快速接入现有项目
- 🧪 **测试完善**：包含完整的单元测试和集成示例

## 快速开始

### 安装

系统已内置，无需额外安装。

### 基本用法

```typescript
import {
  globalEventBus,
  globalServiceRegistry,
  useEvent,
  useService,
  useEmit,
} from './utils';

// 1. 定义服务
class LoggerService {
  name = 'LoggerService';
  
  log(message: string) {
    console.log(`[${this.name}] ${message}`);
  }
}

// 2. 注册服务
globalServiceRegistry.register('LoggerService', {
  service: new LoggerService(),
});

// 3. 使用 hooks 获取服务
const logger = useService('LoggerService');
logger?.log('Hello from hooks!');

// 4. 发布和订阅事件
const emit = useEmit();

// 订阅事件
useEvent('user:created', (user) => {
  console.log(`New user created: ${user.name}`);
});

// 发布事件
emit('user:created', { name: '张三', email: 'zhangsan@example.com' });
```

## 核心组件

### 1. 事件总线 (EventBus)

```typescript
import { globalEventBus } from './utils';

// 订阅事件
const unsubscribe = globalEventBus.on('config:changed', (newConfig) => {
  console.log('Config changed:', newConfig);
});

// 发布事件
globalEventBus.emit('config:changed', { theme: 'dark' });

// 取消订阅
unsubscribe();

// 一次性事件
globalEventBus.once('app:ready', () => {
  console.log('App is ready!');
});

// 异步事件处理
await globalEventBus.emitAsync('data:loaded', data);
```

### 2. 服务注册表 (ServiceRegistry)

```typescript
import { globalServiceRegistry, Service } from './utils';

// 定义服务接口
interface UserService extends Service {
  name: 'UserService';
  getUser(id: string): Promise<any>;
  createUser(user: any): Promise<any>;
}

// 注册服务
class UserServiceImpl implements UserService {
  name = 'UserService';
  
  async getUser(id: string) {
    return { id, name: 'Test User' };
  }
  
  async createUser(user: any) {
    return { ...user, id: Date.now().toString() };
  }
}

globalServiceRegistry.register('UserService', {
  service: new UserServiceImpl(),
  singleton: true, // 单例模式
});

// 获取服务
const userService = globalServiceRegistry.get<UserService>('UserService');
const user = await userService?.getUser('123');
```

### 3. Hooks API

```typescript
import {
  useEvent,
  useEventOnce,
  useService,
  useServiceAsync,
  useEventState,
  useConfig,
  useEmit,
  useEffect,
} from './utils';

// 事件订阅钩子
const App = () => {
  const [theme, setTheme] = useConfig('theme', 'light');
  
  // 监听主题变化
  useEvent('theme:changed', (newTheme) => {
    setTheme(newTheme);
  });
  
  // 获取服务
  const logger = useService('LoggerService');
  
  // 发布事件
  const emit = useEmit();
  
  const handleClick = () => {
    emit('button:clicked', { buttonId: 'theme-toggle' });
  };
  
  // 副作用处理
  useEffect(() => {
    console.log('Component mounted');
    
    return () => {
      console.log('Component unmounted');
    };
  }, []);
  
  return { theme, logger, handleClick };
};
```

## 高级功能

### 装饰器支持

```typescript
import { ServiceDecorator, Inject } from './utils';

@ServiceDecorator({
  name: 'OrderService',
  dependencies: ['UserService', 'PaymentService'],
  singleton: true,
})
class OrderService {
  name = 'OrderService';
  
  @Inject('UserService')
  private userService!: any;
  
  @Inject('PaymentService')
  private paymentService!: any;
  
  async createOrder(orderData: any) {
    const user = await this.userService.getUser(orderData.userId);
    const payment = await this.paymentService.process(orderData.payment);
    
    return { ...orderData, user, payment };
  }
}
```

### 预定义事件钩子

```typescript
import { portEvents, microserviceEvents } from './utils';

// 端口管理事件
portEvents.allocated.use(({ port, serviceName }) => {
  console.log(`Port ${port} allocated for ${serviceName}`);
});

portEvents.released.use(({ port, serviceName }) => {
  console.log(`Port ${port} released from ${serviceName}`);
});

// 微服务事件
microserviceEvents.created.use(({ name, port }) => {
  console.log(`Microservice ${name} created on port ${port}`);
});

microserviceEvents.started.use(({ name, pid }) => {
  console.log(`Microservice ${name} started with PID ${pid}`);
});
```

### 集成现有项目

```typescript
import { autoIntegrateProject, createServiceWrapper } from './utils';

// 自动集成现有项目
const existingProject = {
  name: 'MyProject',
  microserviceManager: existingMicroserviceManager,
  portManager: existingPortManager,
  configManager: existingConfigManager,
};

autoIntegrateProject(existingProject);

// 包装现有服务
const existingService = {
  getUser(id: string) {
    return { id, name: 'Existing User' };
  }
};

const wrappedService = createServiceWrapper(existingService, 'UserService');
// 现在 wrappedService 会自动发布事件
```

## 实际应用示例

### 微服务监控面板

```typescript
import { useServiceStatus, microserviceEvents } from './utils';

class MicroserviceMonitor {
  private services = new Map<string, any>();
  
  constructor() {
    // 监听所有微服务事件
    microserviceEvents.created.use(this.handleServiceCreated.bind(this));
    microserviceEvents.started.use(this.handleServiceStarted.bind(this));
    microserviceEvents.stopped.use(this.handleServiceStopped.bind(this));
  }
  
  private handleServiceCreated(data: any) {
    const { name } = data;
    this.services.set(name, {
      ...data,
      status: 'created',
      lastUpdate: new Date(),
    });
    
    // 开始监控服务状态
    const status = useServiceStatus(name);
    console.log(`Started monitoring ${name}:`, status);
  }
  
  private handleServiceStarted(data: any) {
    const { name, pid } = data;
    const service = this.services.get(name);
    
    if (service) {
      service.status = 'running';
      service.pid = pid;
      service.lastUpdate = new Date();
      this.services.set(name, service);
      
      console.log(`Service ${name} is now running (PID: ${pid})`);
    }
  }
  
  private handleServiceStopped(data: any) {
    const { name } = data;
    const service = this.services.get(name);
    
    if (service) {
      service.status = 'stopped';
      service.lastUpdate = new Date();
      this.services.set(name, service);
      
      console.log(`Service ${name} has stopped`);
    }
  }
  
  getServiceStatus(name: string) {
    return this.services.get(name);
  }
  
  getAllServices() {
    return Array.from(this.services.values());
  }
}
```

### 配置热重载

```typescript
import { useConfig, createEventHook } from './utils';

// 创建配置变更钩子
const themeConfig = createEventHook<string>('theme:config');

class ThemeManager {
  constructor() {
    // 监听配置变更
    themeConfig.use(this.handleThemeChange.bind(this));
    
    // 使用响应式配置
    const { config: theme } = useConfig('theme', 'light');
    console.log('Current theme:', theme);
  }
  
  private handleThemeChange(newTheme: string) {
    console.log(`Theme changed to: ${newTheme}`);
    this.applyTheme(newTheme);
  }
  
  private applyTheme(theme: string) {
    // 应用主题到 UI
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  setTheme(theme: string) {
    // 发布主题变更事件
    themeConfig.emit(theme);
  }
}
```

## API 参考

### EventBus

| 方法 | 描述 |
|------|------|
| `on(event, handler)` | 订阅事件 |
| `once(event, handler)` | 订阅一次性事件 |
| `off(event, handler?)` | 取消订阅事件 |
| `emit(event, data?)` | 发布事件 |
| `emitAsync(event, data?)` | 异步发布事件 |
| `has(event)` | 检查事件是否有监听器 |
| `listenerCount(event)` | 获取监听器数量 |
| `clear()` | 清除所有监听器 |

### ServiceRegistry

| 方法 | 描述 |
|------|------|
| `register(name, registration)` | 注册服务 |
| `registerFactory(name, factory)` | 注册服务工厂 |
| `get(name)` | 获取服务实例 |
| `getAsync(name)` | 异步获取服务实例 |
| `has(name)` | 检查服务是否已注册 |
| `initializeAll()` | 初始化所有服务 |
| `destroyAll()` | 销毁所有服务 |

### Hooks

| Hook | 描述 |
|------|------|
| `useEvent(event, handler)` | 订阅事件 |
| `useEventOnce(event, handler)` | 订阅一次性事件 |
| `useService(serviceName)` | 获取服务实例 |
| `useServiceAsync(serviceName)` | 异步获取服务实例 |
| `useEventState(event, options)` | 响应式事件状态 |
| `useConfig(key, defaultValue)` | 配置管理 |
| `useEmit()` | 发布事件 |
| `useEmitAsync()` | 异步发布事件 |
| `useEffect(effect, deps)` | 副作用处理 |
| `useHooks(hooks)` | 批量注册钩子 |

## 测试

运行测试：

```bash
npm test -- hooks.test.ts
```

## 最佳实践

1. **使用单例服务**：对于全局状态管理，使用单例服务
2. **合理使用事件**：避免过度使用事件，只在需要解耦的组件间使用
3. **及时清理**：使用 `useEffect` 或 `HookManager` 清理资源
4. **类型安全**：为事件和服务定义 TypeScript 接口
5. **错误处理**：事件处理器应该处理自己的错误，避免影响其他监听器

## 注意事项

1. 事件总线是同步的（除非使用 `emitAsync`）
2. 服务注册表不支持循环依赖
3. Hooks 需要在函数组件内部使用
4. 装饰器需要在类定义时使用

## 扩展

可以通过以下方式扩展系统：

1. 添加持久化事件存储
2. 支持远程事件总线
3. 添加服务健康检查
4. 支持服务版本控制
5. 添加服务熔断和降级

## 许可证

MIT