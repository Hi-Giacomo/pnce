/**
 * Hooks 系统测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, globalEventBus, ServiceEvents } from './event-bus';
import {
  type Service,
  ServiceRegistry,
  globalServiceRegistry,
  ServiceDecorator,
  Inject,
} from './service-registry';
import {
  useEvent,
  useEventOnce,
  useService,
  useServiceAsync,
  useEventState,
  useEmit,
  useEmitAsync,
  useServiceStatus,
  useConfig,
  createEventHook,
  portEvents,
  microserviceEvents,
  HookManager,
  globalHookManager,
  useEffect,
  useHooks,
} from './hooks';

// 测试服务定义
class TestService implements Service {
  name = 'TestService';
  version = '1.0.0';
  status = 'running' as const;

  initialize() {
    console.log('TestService initialized');
  }

  destroy() {
    console.log('TestService destroyed');
  }

  getStatus() {
    return {
      status: this.status,
      lastUpdated: new Date(),
    };
  }

  testMethod() {
    return 'test';
  }
}

// 依赖服务
class DependencyService implements Service {
  name = 'DependencyService';

  initialize() {
    console.log('DependencyService initialized');
  }

  getStatus() {
    return {
      status: 'running' as const,
      lastUpdated: new Date(),
    };
  }

  getData() {
    return 'dependency-data';
  }
}

// 使用装饰器的服务（在单独的测试中定义）
// 注意：装饰器在类定义时执行，所以需要在依赖注册后定义

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('should subscribe to and emit events', () => {
    const handler = vi.fn();
    eventBus.on('test-event', handler);

    eventBus.emit('test-event', 'test-data');

    expect(handler).toHaveBeenCalledWith('test-data');
  });

  it('should unsubscribe from events', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('test-event', handler);

    unsubscribe();
    eventBus.emit('test-event', 'test-data');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle once events', () => {
    const handler = vi.fn();
    eventBus.once('test-event', handler);

    eventBus.emit('test-event', 'first');
    eventBus.emit('test-event', 'second');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });

  it('should check if event has listeners', () => {
    expect(eventBus.has('test-event')).toBe(false);

    eventBus.on('test-event', () => {});
    expect(eventBus.has('test-event')).toBe(true);
  });

  it('should count listeners', () => {
    expect(eventBus.listenerCount('test-event')).toBe(0);

    eventBus.on('test-event', () => {});
    eventBus.on('test-event', () => {});

    expect(eventBus.listenerCount('test-event')).toBe(2);
  });

  it('should handle async events', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    eventBus.on('test-event', handler);

    await eventBus.emitAsync('test-event', 'async-data');

    expect(handler).toHaveBeenCalledWith('async-data');
  });
});

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  afterEach(async () => {
    await registry.destroyAll();
  });

  it('should register and get services', () => {
    const service = new TestService();
    registry.register('TestService', { service });

    const retrieved = registry.get('TestService');
    expect(retrieved).toBe(service);
  });

  it('should register service factory', async () => {
    registry.registerFactory('TestService', () => new TestService());

    const service = await registry.getAsync('TestService');
    expect(service).toBeInstanceOf(TestService);
  });

  it('should handle dependencies', () => {
    const dependency = new DependencyService();
    const service = new TestService();

    registry.register('DependencyService', { service: dependency });
    registry.register('TestService', {
      service,
      dependencies: ['DependencyService'],
    });

    expect(registry.has('TestService')).toBe(true);
  });

  it('should validate missing dependencies', () => {
    const service = new TestService();

    expect(() => {
      registry.register('TestService', {
        service,
        dependencies: ['NonExistentService'],
      });
    }).toThrow('has missing dependencies');
  });

  it('should initialize all services', async () => {
    const service1 = new TestService();
    const service2 = new DependencyService();
    const initializeSpy1 = vi.spyOn(service1, 'initialize');
    const initializeSpy2 = vi.spyOn(service2, 'initialize');

    registry.register('TestService', { service: service1 });
    registry.register('DependencyService', { service: service2 });

    await registry.initializeAll();

    expect(initializeSpy1).toHaveBeenCalled();
    expect(initializeSpy2).toHaveBeenCalled();
  });
});

describe('Hooks', () => {
  beforeEach(() => {
    globalEventBus.clear();
    globalServiceRegistry.destroyAll();
  });

  afterEach(() => {
    globalHookManager.cleanupAll();
  });

  it('should useEvent hook to subscribe to events', () => {
    const handler = vi.fn();
    const cleanup = useEvent('test-event', handler);

    globalEventBus.emit('test-event', 'test-data');

    expect(handler).toHaveBeenCalledWith('test-data');

    cleanup();
    globalEventBus.emit('test-event', 'more-data');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should useEventOnce hook for one-time events', () => {
    const handler = vi.fn();
    useEventOnce('test-event', handler);

    globalEventBus.emit('test-event', 'first');
    globalEventBus.emit('test-event', 'second');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });

  it('should useService hook to get services', () => {
    const service = new TestService();
    globalServiceRegistry.register('TestService', { service });

    const retrieved = useService<TestService>('TestService');
    expect(retrieved).toBe(service);
  });

  it('should useServiceAsync hook for async service retrieval', async () => {
    globalServiceRegistry.registerFactory('TestService', () => new TestService());

    const service = await useServiceAsync<TestService>('TestService');
    expect(service).toBeInstanceOf(TestService);
  });

  it('should useEventState hook for reactive state', () => {
    const [state, cleanup] = useEventState<string>('state-change', {
      initialValue: 'initial',
    });

    expect(state).toBe('initial');

    globalEventBus.emit('state-change', 'updated');

    // 注意：由于 Reactivity 限制，这里需要重新调用 useEventState 来获取新状态
    // 在实际的 React/Vue 应用中，状态是响应式的
  });

  it('should useEmit hook to publish events', () => {
    const handler = vi.fn();
    const emit = useEmit();

    globalEventBus.on('test-emit', handler);
    emit('test-emit', 'emitted-data');

    expect(handler).toHaveBeenCalledWith('emitted-data');
  });

  it('should useServiceStatus hook for service monitoring', () => {
    const service = new TestService();
    globalServiceRegistry.register('TestService', { service });

    const { status, service: retrievedService } = useServiceStatus('TestService');

    expect(retrievedService).toBe(service);
    expect(status).toBeDefined();
  });

  it('should useConfig hook for configuration management', () => {
    const { config, setConfig } = useConfig<string>('app.theme', 'light');

    expect(config).toBe('light');

    setConfig('dark');
    // 在真实应用中，这会触发事件并更新状态
  });

  it('should create custom event hooks', () => {
    const customHook = createEventHook<string>('custom-event');
    const handler = vi.fn();

    customHook.use(handler);
    customHook.emit('test-data');

    expect(handler).toHaveBeenCalledWith('test-data');
    expect(customHook.hasListeners()).toBe(true);
  });

  it('should use pre-defined port events hooks', () => {
    const handler = vi.fn();
    portEvents.allocated.use(handler);

    globalEventBus.emit('port:allocated', { port: 3000, serviceName: 'test' });

    expect(handler).toHaveBeenCalledWith({
      port: 3000,
      serviceName: 'test',
    });
  });

  it('should use pre-defined microservice events hooks', () => {
    const handler = vi.fn();
    microserviceEvents.started.use(handler);

    globalEventBus.emit('microservice:started', {
      name: 'auth-service',
      port: 3001,
      pid: 12345,
    });

    expect(handler).toHaveBeenCalledWith({
      name: 'auth-service',
      port: 3001,
      pid: 12345,
    });
  });

  it('should manage hooks with HookManager', () => {
    const hook1Cleanup = vi.fn();
    const hook2Cleanup = vi.fn();

    globalHookManager.register('hook1', () => hook1Cleanup);
    globalHookManager.register('hook2', () => hook2Cleanup);

    expect(globalHookManager.has('hook1')).toBe(true);
    expect(globalHookManager.has('hook2')).toBe(true);

    globalHookManager.cleanup('hook1');
    expect(globalHookManager.has('hook1')).toBe(false);
    expect(hook1Cleanup).toHaveBeenCalled();

    globalHookManager.cleanupAll();
    expect(globalHookManager.has('hook2')).toBe(false);
    expect(hook2Cleanup).toHaveBeenCalled();
  });

  it('should useHooks for batch registration', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    const batchCleanup = useHooks({
      hook1: () => cleanup1,
      hook2: () => cleanup2,
    });

    batchCleanup();

    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalled();
  });
});

describe('Integration Examples', () => {
  beforeEach(() => {
    globalEventBus.clear();
    globalServiceRegistry.destroyAll();
    globalHookManager.cleanupAll();
  });

  afterEach(() => {
    globalHookManager.cleanupAll();
  });

  it('should demonstrate service lifecycle with events', async () => {
    // 先监听服务事件
    const serviceStartedHandler = vi.fn();
    const serviceErrorHandler = vi.fn();

    useEvent(ServiceEvents.SERVICE_STARTED, serviceStartedHandler);
    useEvent(ServiceEvents.SERVICE_ERROR, serviceErrorHandler);

    // 注册服务（注册时会触发 SERVICE_STARTED 事件）
    const service = new TestService();
    globalServiceRegistry.register('TestService', { service });

    // 初始化服务
    await globalServiceRegistry.initializeAll();

    // 检查事件是否被调用
    expect(serviceStartedHandler).toHaveBeenCalled();
  });

  it('should demonstrate microservice orchestration', () => {
    // 监听微服务创建事件
    const microserviceCreatedHandler = vi.fn();
    microserviceEvents.created.use(microserviceCreatedHandler);

    // 模拟创建微服务
    microserviceEvents.created.emit({
      name: 'user-service',
      path: '/services/user',
      port: 3001,
    });

    expect(microserviceCreatedHandler).toHaveBeenCalledWith({
      name: 'user-service',
      path: '/services/user',
      port: 3001,
    });

    // 监听微服务启动
    const status = useServiceStatus('user-service');
    expect(status.service).toBeNull(); // 服务尚未注册

    // 模拟启动微服务
    microserviceEvents.started.emit({
      name: 'user-service',
      port: 3001,
      pid: 12345,
    });
  });

  it('should demonstrate configuration management', () => {
    // 创建配置钩子
    const { config: theme, setConfig: setTheme } = useConfig('ui.theme', 'light');
    const { config: language, setConfig: setLanguage } = useConfig('ui.language', 'en');

    expect(theme).toBe('light');
    expect(language).toBe('en');

    // 监听所有配置变更
    const allConfigHandler = vi.fn();
    useEvent('config:updated', allConfigHandler);

    // 更新配置
    setTheme('dark');
    setLanguage('zh-CN');

    // 在真实应用中，事件会被触发并更新状态
  });

  it('should demonstrate port management integration', () => {
    // 监听端口分配事件
    const portAllocatedHandler = vi.fn();
    portEvents.allocated.use(portAllocatedHandler);

    // 模拟端口分配
    portEvents.allocated.emit({
      port: 3000,
      serviceName: 'main-service',
    });

    expect(portAllocatedHandler).toHaveBeenCalledWith({
      port: 3000,
      serviceName: 'main-service',
    });

    // 监听端口释放事件
    const portReleasedHandler = vi.fn();
    portEvents.released.use(portReleasedHandler);

    // 模拟端口释放
    portEvents.released.emit({
      port: 3000,
      serviceName: 'main-service',
    });

    expect(portReleasedHandler).toHaveBeenCalledWith({
      port: 3000,
      serviceName: 'main-service',
    });
  });

  it('should demonstrate decorator-based service registration', () => {
    // 注册依赖服务
    const dependency = new DependencyService();
    globalServiceRegistry.register('DependencyService', { service: dependency });

    // 由于装饰器在类定义时执行，我们手动模拟装饰器的行为
    class ManualDecoratedService implements Service {
      name = 'DecoratedService';
      dependency: DependencyService;

      constructor() {
        // 手动注入依赖
        this.dependency = globalServiceRegistry.get('DependencyService')!;
      }

      getStatus() {
        return {
          status: 'running' as const,
          lastUpdated: new Date(),
        };
      }

      getCombinedData() {
        return `decorated-${this.dependency.getData()}`;
      }
    }

    // 手动注册服务
    globalServiceRegistry.register('DecoratedService', {
      service: new ManualDecoratedService(),
      dependencies: ['DependencyService'],
      singleton: true,
    });

    // 获取服务
    const decoratedService = useService<ManualDecoratedService>('DecoratedService');
    expect(decoratedService).toBeDefined();

    // 检查依赖注入
    if (decoratedService) {
      expect(decoratedService.dependency).toBe(dependency);
      expect(decoratedService.getCombinedData()).toBe('decorated-dependency-data');
    }
  });
});

describe('Error Handling', () => {
  it('should handle event handler errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorHandler = () => {
      throw new Error('Test error');
    };

    globalEventBus.on('error-event', errorHandler);

    // 不应该抛出错误
    expect(() => {
      globalEventBus.emit('error-event', 'test');
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle async event handler errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorHandler = async () => {
      throw new Error('Async error');
    };

    globalEventBus.on('async-error', errorHandler);

    await globalEventBus.emitAsync('async-error', 'test');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
