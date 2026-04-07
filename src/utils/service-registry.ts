/**
 * 服务注册表
 * 管理服务实例，支持服务发现和依赖注入
 */

import { EventType, EventHandler, globalEventBus, ServiceEvents } from './event-bus';

// 服务接口
export interface Service {
  // 服务标识符
  name: string;
  // 服务版本
  version?: string;
  // 服务初始化方法
  initialize?(): void | Promise<void>;
  // 服务销毁方法
  destroy?(): void | Promise<void>;
  // 获取服务状态
  getStatus?(): ServiceStatus;
}

// 服务状态
export interface ServiceStatus {
  status: 'initializing' | 'running' | 'stopped' | 'error';
  lastUpdated: Date;
  error?: Error;
}

// 服务注册信息
export interface ServiceRegistration<T extends Service = Service> {
  service: T;
  dependencies?: string[]; // 依赖的服务名称
  singleton?: boolean; // 是否为单例模式
}

// 服务工厂函数
export type ServiceFactory<T extends Service = Service> = () => T | Promise<T>;

// 服务注册表类
export class ServiceRegistry {
  private services: Map<string, ServiceRegistration> = new Map();
  private instances: Map<string, Service> = new Map();
  private factories: Map<string, ServiceFactory> = new Map();

  /**
   * 注册服务
   * @param name 服务名称
   * @param registration 服务注册信息
   */
  register<T extends Service>(
    name: string,
    registration: ServiceRegistration<T>
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }

    this.services.set(name, registration);

    // 如果服务有依赖，检查依赖是否可用
    if (registration.dependencies && registration.dependencies.length > 0) {
      this.validateDependencies(name, registration.dependencies);
    }

    // 发布服务注册事件
    globalEventBus.emit(ServiceEvents.SERVICE_STARTED, {
      serviceName: name,
      registration,
      timestamp: new Date(),
    });
  }

  /**
   * 注册服务工厂
   * @param name 服务名称
   * @param factory 服务工厂函数
   * @param dependencies 依赖的服务名称
   */
  registerFactory<T extends Service>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies?: string[]
  ): void {
    if (this.factories.has(name)) {
      throw new Error(`Service factory "${name}" is already registered`);
    }

    this.factories.set(name, factory);

    // 如果服务有依赖，检查依赖是否可用
    if (dependencies && dependencies.length > 0) {
      this.validateDependencies(name, dependencies);
    }

    // 发布服务注册事件
    globalEventBus.emit(ServiceEvents.SERVICE_STARTED, {
      serviceName: name,
      factory: true,
      dependencies,
      timestamp: new Date(),
    });
  }

  /**
   * 获取服务实例
   * @param name 服务名称
   */
  get<T extends Service = Service>(name: string): T | null {
    // 先从实例缓存中获取
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    // 检查是否有注册的服务
    const registration = this.services.get(name);
    if (registration) {
      // 如果是单例模式，创建实例并缓存
      if (registration.singleton !== false) {
        const instance = registration.service;
        this.instances.set(name, instance);
        return instance as T;
      }
      return registration.service as T;
    }

    // 检查是否有服务工厂
    const factory = this.factories.get(name);
    if (factory) {
      const instance = factory();
      
      // 如果是 Promise，需要异步处理
      if (instance instanceof Promise) {
        instance.then(resolvedInstance => {
          this.instances.set(name, resolvedInstance);
          return resolvedInstance;
        }).catch(error => {
          console.error(`Failed to create service instance "${name}":`, error);
          return null;
        });
        return null; // 暂时返回 null，等待异步完成
      }
      
      this.instances.set(name, instance);
      return instance as T;
    }

    return null;
  }

  /**
   * 异步获取服务实例
   * @param name 服务名称
   */
  async getAsync<T extends Service = Service>(name: string): Promise<T | null> {
    // 先从实例缓存中获取
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    // 检查是否有注册的服务
    const registration = this.services.get(name);
    if (registration) {
      // 如果是单例模式，创建实例并缓存
      if (registration.singleton !== false) {
        const instance = registration.service;
        this.instances.set(name, instance);
        return instance as T;
      }
      return registration.service as T;
    }

    // 检查是否有服务工厂
    const factory = this.factories.get(name);
    if (factory) {
      try {
        const instance = await Promise.resolve(factory());
        this.instances.set(name, instance);
        return instance as T;
      } catch (error) {
        console.error(`Failed to create service instance "${name}":`, error);
        return null;
      }
    }

    return null;
  }

  /**
   * 检查服务是否已注册
   * @param name 服务名称
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * 初始化所有服务（按依赖顺序）
   */
  async initializeAll(): Promise<void> {
    const serviceNames = Array.from(this.services.keys());
    const initialized: Set<string> = new Set();
    const errors: Map<string, Error> = new Map();

    // 初始化函数（递归处理依赖）
    const initializeService = async (serviceName: string): Promise<void> => {
      if (initialized.has(serviceName)) {
        return;
      }

      const registration = this.services.get(serviceName);
      if (!registration) {
        return;
      }

      // 先初始化依赖
      if (registration.dependencies) {
        for (const depName of registration.dependencies) {
          if (!initialized.has(depName)) {
            await initializeService(depName);
          }
        }
      }

      // 初始化服务本身
      try {
        if (registration.service.initialize) {
          await Promise.resolve(registration.service.initialize());
        }
        initialized.add(serviceName);
        
        // 发布服务初始化完成事件
        globalEventBus.emit('service:initialized', {
          serviceName,
          status: 'running',
          timestamp: new Date(),
        });
      } catch (error) {
        errors.set(serviceName, error as Error);
        console.error(`Failed to initialize service "${serviceName}":`, error);
        
        // 发布服务错误事件
        globalEventBus.emit(ServiceEvents.SERVICE_ERROR, {
          serviceName,
          error,
          timestamp: new Date(),
        });
      }
    };

    // 按拓扑顺序初始化所有服务
    for (const serviceName of serviceNames) {
      if (!initialized.has(serviceName)) {
        await initializeService(serviceName);
      }
    }

    // 如果有错误，抛出聚合错误
    if (errors.size > 0) {
      throw new Error(
        `Failed to initialize services: ${Array.from(errors.entries())
          .map(([name, error]) => `${name}: ${error.message}`)
          .join('; ')}`
      );
    }
  }

  /**
   * 销毁所有服务
   */
  async destroyAll(): Promise<void> {
    const instances = Array.from(this.instances.values());
    
    // 逆序销毁（最后创建的先销毁）
    for (let i = instances.length - 1; i >= 0; i--) {
      const instance = instances[i];
      if (instance.destroy) {
        try {
          await Promise.resolve(instance.destroy());
          
          // 发布服务停止事件
          globalEventBus.emit(ServiceEvents.SERVICE_STOPPED, {
            serviceName: instance.name,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Failed to destroy service "${instance.name}":`, error);
        }
      }
    }

    // 清空缓存
    this.instances.clear();
    this.services.clear();
    this.factories.clear();
  }

  /**
   * 获取所有服务名称
   */
  get serviceNames(): string[] {
    const serviceNames = new Set<string>();
    Array.from(this.services.keys()).forEach(name => serviceNames.add(name));
    Array.from(this.factories.keys()).forEach(name => serviceNames.add(name));
    return Array.from(serviceNames);
  }

  /**
   * 获取服务注册信息
   * @param name 服务名称
   */
  getRegistration(name: string): ServiceRegistration | null {
    return this.services.get(name) || null;
  }

  /**
   * 验证服务依赖
   * @param serviceName 服务名称
   * @param dependencies 依赖列表
   */
  private validateDependencies(serviceName: string, dependencies: string[]): void {
    const missingDeps: string[] = [];
    
    for (const depName of dependencies) {
      if (!this.has(depName)) {
        missingDeps.push(depName);
      }
    }

    if (missingDeps.length > 0) {
      throw new Error(
        `Service "${serviceName}" has missing dependencies: ${missingDeps.join(', ')}`
      );
    }
  }
}

// 全局服务注册表实例
export const globalServiceRegistry = new ServiceRegistry();

// 装饰器：服务装饰器
export function ServiceDecorator(options: {
  name: string;
  dependencies?: string[];
  singleton?: boolean;
}): ClassDecorator {
  return function (target: any) {
    // 创建服务实例
    const instance = new target();
    
    // 注册服务
    globalServiceRegistry.register(options.name, {
      service: {
        ...instance,
        name: options.name,
      },
      dependencies: options.dependencies,
      singleton: options.singleton,
    });
    
    return target;
  };
}

// 装饰器：服务依赖注入
export function Inject(serviceName: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // 定义 getter 来获取服务实例
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return globalServiceRegistry.get(serviceName);
      },
      enumerable: true,
      configurable: true,
    });
  };
}