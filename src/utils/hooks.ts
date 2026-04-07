/**
 * Hooks 系统
 * 提供类似 React hooks 的 API，让开发者可以方便地订阅事件和获取服务
 */

import { EventType, EventHandler, globalEventBus } from './event-bus';
import { Service, globalServiceRegistry } from './service-registry';

// 事件订阅钩子
export function useEvent<T = any>(
  event: EventType,
  handler: EventHandler<T>,
  dependencies: any[] = []
): () => void {
  // 订阅事件
  const unsubscribe = globalEventBus.on(event, handler);

  // 返回清理函数
  return () => {
    unsubscribe();
  };
}

// 一次性事件订阅钩子
export function useEventOnce<T = any>(
  event: EventType,
  handler: EventHandler<T>
): () => void {
  // 订阅一次性事件
  const unsubscribe = globalEventBus.once(event, handler);

  // 返回清理函数
  return () => {
    unsubscribe();
  };
}

// 服务获取钩子
export function useService<T extends Service = Service>(
  serviceName: string
): T | null {
  return globalServiceRegistry.get<T>(serviceName);
}

// 异步服务获取钩子
export function useServiceAsync<T extends Service = Service>(
  serviceName: string
): Promise<T | null> {
  return globalServiceRegistry.getAsync<T>(serviceName);
}

// 事件状态钩子（用于响应式状态管理）
export interface EventStateOptions<T = any> {
  initialValue?: T;
  transform?: (data: any) => T;
}

export function useEventState<T = any>(
  event: EventType,
  options: EventStateOptions<T> = {}
): [T | undefined, () => void] {
  let state: T | undefined = options.initialValue;
  
  const handler: EventHandler = (data: any) => {
    if (options.transform) {
      state = options.transform(data);
    } else {
      state = data as T;
    }
  };

  // 订阅事件
  const unsubscribe = globalEventBus.on(event, handler);

  // 获取当前状态的函数
  const getState = () => state;

  // 返回状态和清理函数
  return [state, unsubscribe];
}

// 发布事件钩子
export function useEmit(): <T = any>(event: EventType, data?: T) => void {
  return (event, data) => {
    globalEventBus.emit(event, data);
  };
}

// 异步发布事件钩子
export function useEmitAsync(): <T = any>(event: EventType, data?: T) => Promise<void> {
  return async (event, data) => {
    await globalEventBus.emitAsync(event, data);
  };
}

// 复合钩子：监听服务状态变化
export function useServiceStatus(serviceName: string) {
  let status: any = { status: 'unknown', serviceName };
  
  const handler: EventHandler = (data: any) => {
    if (data.serviceName === serviceName) {
      status = data;
    }
  };

  const unsubscribe = globalEventBus.on('service:status', handler);

  // 获取当前服务实例
  const service = useService(serviceName);

  return {
    status,
    service,
    unsubscribe,
  };
}

// 复合钩子：监听配置变化
export function useConfig<T = any>(configKey: string, defaultValue?: T) {
  let config: T | undefined = defaultValue;
  
  const handler: EventHandler = (data: any) => {
    if (data.key === configKey) {
      config = data.value;
    }
  };

  const unsubscribe = globalEventBus.on('config:updated', handler);

  const setConfig = (value: T) => {
    globalEventBus.emit('config:updated', {
      key: configKey,
      value,
      timestamp: new Date(),
    });
  };

  return {
    config,
    setConfig,
    unsubscribe,
  };
}

// 复合钩子：创建自定义事件钩子
export function createEventHook<T = any>(eventName: EventType) {
  return {
    use: (handler: EventHandler<T>) => useEvent(eventName, handler),
    useOnce: (handler: EventHandler<T>) => useEventOnce(eventName, handler),
    emit: (data?: T) => globalEventBus.emit(eventName, data),
    emitAsync: (data?: T) => globalEventBus.emitAsync(eventName, data),
    hasListeners: () => globalEventBus.has(eventName),
  };
}

// 示例：端口管理事件钩子
export const portEvents = {
  allocated: createEventHook<{ port: number; serviceName: string }>('port:allocated'),
  released: createEventHook<{ port: number; serviceName: string }>('port:released'),
  error: createEventHook<{ error: Error; serviceName: string }>('port:error'),
};

// 示例：微服务事件钩子
export const microserviceEvents = {
  created: createEventHook<{ name: string; path: string; port: number }>('microservice:created'),
  started: createEventHook<{ name: string; port: number; pid: number }>('microservice:started'),
  stopped: createEventHook<{ name: string; port: number }>('microservice:stopped'),
};

// 钩子管理工具
export class HookManager {
  private hooks: Map<string, () => void> = new Map();

  /**
   * 注册钩子
   * @param id 钩子标识符
   * @param hook 钩子函数（返回清理函数）
   */
  register(id: string, hook: () => () => void): void {
    // 如果已经存在相同的钩子，先清理
    if (this.hooks.has(id)) {
      this.cleanup(id);
    }

    const cleanup = hook();
    this.hooks.set(id, cleanup);
  }

  /**
   * 清理单个钩子
   * @param id 钩子标识符
   */
  cleanup(id: string): void {
    const cleanup = this.hooks.get(id);
    if (cleanup) {
      cleanup();
      this.hooks.delete(id);
    }
  }

  /**
   * 清理所有钩子
   */
  cleanupAll(): void {
    for (const [id, cleanup] of this.hooks) {
      cleanup();
      this.hooks.delete(id);
    }
  }

  /**
   * 检查钩子是否存在
   * @param id 钩子标识符
   */
  has(id: string): boolean {
    return this.hooks.has(id);
  }

  /**
   * 获取所有钩子ID
   */
  get hookIds(): string[] {
    return Array.from(this.hooks.keys());
  }
}

// 全局钩子管理器实例
export const globalHookManager = new HookManager();

// React风格的 useEffect 钩子（简化版）
export function useEffect(effect: () => void | (() => void), dependencies?: any[]): void {
  // 执行副作用
  const cleanup = effect();
  
  // 如果有清理函数，返回它
  if (typeof cleanup === 'function') {
    // 在组件卸载时执行清理
    const handleUnload = () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    
    // 注册全局清理函数（简化实现）
    globalHookManager.register(`useEffect-${Date.now()}`, () => handleUnload);
  }
}

// 工具函数：批量注册钩子
export function useHooks(hooks: Record<string, () => () => void>): () => void {
  const cleanupFunctions: (() => void)[] = [];

  // 注册所有钩子
  for (const [id, hook] of Object.entries(hooks)) {
    const cleanup = hook();
    globalHookManager.register(id, () => cleanup);
    cleanupFunctions.push(cleanup);
  }

  // 返回批量清理函数
  return () => {
    for (const cleanup of cleanupFunctions) {
      cleanup();
    }
  };
}