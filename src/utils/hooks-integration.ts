/**
 * Hooks 系统集成工具
 * 提供快速集成现有项目的工具函数
 */

import { globalEventBus, ServiceEvents, type EventType, type EventHandler } from './event-bus';
import { globalServiceRegistry } from './service-registry';
import { globalHookManager } from './hooks';

/**
 * 集成现有的微服务管理器
 * @param microserviceManager 现有的微服务管理器实例
 */
export function integrateMicroserviceManager(microserviceManager: any) {
  if (!microserviceManager) return;
  
  // 监听微服务创建
  const originalCreate = microserviceManager.createMicroservice;
  if (typeof originalCreate === 'function') {
    microserviceManager.createMicroservice = function(...args: any[]) {
      const result = originalCreate.apply(this, args);
      
      // 如果是 Promise，等待完成
      if (result instanceof Promise) {
        return result.then((service: any) => {
          globalEventBus.emit('microservice:created', {
            name: service.name || 'unknown',
            path: service.path || '',
            port: service.port || 0,
            timestamp: new Date(),
          });
          return service;
        });
      }
      
      // 如果是同步调用
      if (result && typeof result === 'object') {
        globalEventBus.emit('microservice:created', {
          name: result.name || 'unknown',
          path: result.path || '',
          port: result.port || 0,
          timestamp: new Date(),
        });
      }
      
      return result;
    };
  }
  
  // 监听微服务启动
  const originalStart = microserviceManager.startMicroservice;
  if (typeof originalStart === 'function') {
    microserviceManager.startMicroservice = function(...args: any[]) {
      const result = originalStart.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then((service: any) => {
          globalEventBus.emit('microservice:started', {
            name: service.name || 'unknown',
            port: service.port || 0,
            pid: service.pid || 0,
            timestamp: new Date(),
          });
          return service;
        });
      }
      
      return result;
    };
  }
  
  // 监听微服务停止
  const originalStop = microserviceManager.stopMicroservice;
  if (typeof originalStop === 'function') {
    microserviceManager.stopMicroservice = function(...args: any[]) {
      const result = originalStop.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then((service: any) => {
          globalEventBus.emit('microservice:stopped', {
            name: service.name || 'unknown',
            port: service.port || 0,
            timestamp: new Date(),
          });
          return service;
        });
      }
      
      return result;
    };
  }
  
  console.log('Microservice manager integrated with hooks system');
}

/**
 * 集成现有的端口管理器
 * @param portManager 现有的端口管理器实例
 */
export function integratePortManager(portManager: any) {
  if (!portManager) return;
  
  // 监听端口分配
  const originalAllocate = portManager.allocatePort;
  if (typeof originalAllocate === 'function') {
    portManager.allocatePort = function(...args: any[]) {
      const result = originalAllocate.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then((port: number) => {
          globalEventBus.emit('port:allocated', {
            port,
            serviceName: args[0] || 'unknown',
            timestamp: new Date(),
          });
          return port;
        });
      }
      
      if (typeof result === 'number') {
        globalEventBus.emit('port:allocated', {
          port: result,
          serviceName: args[0] || 'unknown',
          timestamp: new Date(),
        });
      }
      
      return result;
    };
  }
  
  // 监听端口释放
  const originalRelease = portManager.releasePort;
  if (typeof originalRelease === 'function') {
    portManager.releasePort = function(...args: any[]) {
      const result = originalRelease.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then((port: number) => {
          globalEventBus.emit('port:released', {
            port,
            serviceName: args[0] || 'unknown',
            timestamp: new Date(),
          });
          return port;
        });
      }
      
      return result;
    };
  }
  
  console.log('Port manager integrated with hooks system');
}

/**
 * 集成现有的配置管理器
 * @param configManager 现有的配置管理器实例
 */
export function integrateConfigManager(configManager: any) {
  if (!configManager) return;
  
  // 监听配置变更
  const originalSet = configManager.set;
  if (typeof originalSet === 'function') {
    configManager.set = function(key: string, value: any) {
      const oldValue = configManager.get ? configManager.get(key) : undefined;
      const result = originalSet.call(this, key, value);
      
      globalEventBus.emit('config:updated', {
        key,
        oldValue,
        newValue: value,
        timestamp: new Date(),
      });
      
      return result;
    };
  }
  
  console.log('Config manager integrated with hooks system');
}

/**
 * 自动集成现有项目中的所有管理器
 * @param project 项目对象，包含各种管理器
 */
export function autoIntegrateProject(project: any) {
  if (!project) return;
  
  // 尝试集成各种管理器
  if (project.microserviceManager) {
    integrateMicroserviceManager(project.microserviceManager);
  }
  
  if (project.portManager) {
    integratePortManager(project.portManager);
  }
  
  if (project.configManager) {
    integrateConfigManager(project.configManager);
  }
  
  // 注册项目本身作为服务
  if (project.name && typeof project === 'object') {
    globalServiceRegistry.register(project.name, {
      service: {
        name: project.name,
        ...project,
      },
    });
  }
  
  console.log('Project auto-integrated with hooks system');
}

/**
 * 创建服务包装器，添加事件发布功能
 * @param service 原始服务对象
 * @param serviceName 服务名称
 */
export function createServiceWrapper<T extends object>(
  service: T,
  serviceName: string
): T {
  const wrapper = { ...service };
  
  // 为所有方法添加事件发布
  Object.keys(wrapper).forEach(key => {
    const originalMethod = (wrapper as any)[key];
    
    if (typeof originalMethod === 'function') {
      (wrapper as any)[key] = function(...args: any[]) {
        const result = originalMethod.apply(this, args);
        
        // 发布方法调用事件
        globalEventBus.emit('service:method:called', {
          serviceName,
          method: key,
          args,
          timestamp: new Date(),
        });
        
        // 处理 Promise 返回值
        if (result instanceof Promise) {
          return result
            .then((value: any) => {
              globalEventBus.emit('service:method:completed', {
                serviceName,
                method: key,
                result: value,
                timestamp: new Date(),
              });
              return value;
            })
            .catch((error: Error) => {
              globalEventBus.emit('service:method:error', {
                serviceName,
                method: key,
                error,
                timestamp: new Date(),
              });
              throw error;
            });
        }
        
        // 同步方法完成
        globalEventBus.emit('service:method:completed', {
          serviceName,
          method: key,
          result,
          timestamp: new Date(),
        });
        
        return result;
      };
    }
  });
  
  // 添加服务生命周期事件
  if ((wrapper as any).initialize) {
    const originalInitialize = (wrapper as any).initialize;
    (wrapper as any).initialize = function(...args: any[]) {
      const result = originalInitialize.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then(() => {
          globalEventBus.emit(ServiceEvents.SERVICE_STARTED, {
            serviceName,
            timestamp: new Date(),
          });
        });
      }
      
      globalEventBus.emit(ServiceEvents.SERVICE_STARTED, {
        serviceName,
        timestamp: new Date(),
      });
      
      return result;
    };
  }
  
  if ((wrapper as any).destroy) {
    const originalDestroy = (wrapper as any).destroy;
    (wrapper as any).destroy = function(...args: any[]) {
      const result = originalDestroy.apply(this, args);
      
      if (result instanceof Promise) {
        return result.then(() => {
          globalEventBus.emit(ServiceEvents.SERVICE_STOPPED, {
            serviceName,
            timestamp: new Date(),
          });
        });
      }
      
      globalEventBus.emit(ServiceEvents.SERVICE_STOPPED, {
        serviceName,
        timestamp: new Date(),
      });
      
      return result;
    };
  }
  
  return wrapper;
}

/**
 * 快速创建事件监听器
 * @param eventMap 事件映射 { 事件名称: 处理函数 }
 */
export function createEventListeners(eventMap: Record<string, EventHandler>) {
  const cleanupFunctions: (() => void)[] = [];
  
  Object.entries(eventMap).forEach(([event, handler]) => {
    const unsubscribe = globalEventBus.on(event, handler);
    cleanupFunctions.push(unsubscribe);
  });
  
  return () => {
    cleanupFunctions.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * 批量注册服务
 * @param services 服务映射 { 服务名称: 服务实例或工厂函数 }
 */
export function registerServices(services: Record<string, any>) {
  Object.entries(services).forEach(([name, service]) => {
    if (typeof service === 'function') {
      // 如果是工厂函数
      globalServiceRegistry.registerFactory(name, service);
    } else {
      // 如果是服务实例
      globalServiceRegistry.register(name, { service });
    }
  });
}

/**
 * 初始化 hooks 系统并返回清理函数
 */
export function initializeHooksSystem(options: {
  autoCleanup?: boolean;
  logEvents?: boolean;
  defaultServices?: Record<string, any>;
} = {}) {
  const { autoCleanup = true, logEvents = false, defaultServices = {} } = options;
  
  // 注册默认服务
  registerServices(defaultServices);
  
  // 启用事件日志
  if (logEvents) {
    // 监听所有事件
    const unsubscribe = globalEventBus.on('*' as EventType, (data: any) => {
      // 注意：实际事件名称需要通过其他方式获取
      // 这里简化处理，只记录数据
      console.log(`[Event] data:`, data);
    });
    
    if (autoCleanup) {
      globalHookManager.register('event-logger', () => unsubscribe);
    }
  }
  
  // 返回清理函数
  return () => {
    if (autoCleanup) {
      globalHookManager.cleanupAll();
      globalServiceRegistry.destroyAll();
      globalEventBus.clear();
    }
  };
}

// 导出集成工具
export default {
  integrateMicroserviceManager,
  integratePortManager,
  integrateConfigManager,
  autoIntegrateProject,
  createServiceWrapper,
  createEventListeners,
  registerServices,
  initializeHooksSystem,
};