/**
 * Hooks 系统使用示例
 * 展示如何在项目中实际使用事件和服务 hooks
 */

import {
  // 事件总线
  globalEventBus,
  ServiceEvents,

  // 服务注册表
  globalServiceRegistry,
  Service,
  ServiceDecorator,
  Inject,
} from './index';

import {
  // Hooks
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
  globalHookManager,
  useEffect,
  useHooks,
} from './hooks';

// ==================== 示例1: 基本服务定义 ====================

/**
 * 日志服务
 */
class LoggerService implements Service {
  name = 'LoggerService';

  log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);

    // 发布日志事件，让其他组件可以监听
    globalEventBus.emit('log:message', {
      message,
      level,
      timestamp,
      service: this.name,
    });
  }
}

/**
 * 配置服务
 */
class ConfigService implements Service {
  name = 'ConfigService';
  private config: Record<string, any> = {};

  initialize() {
    // 加载默认配置
    this.config = {
      theme: 'light',
      language: 'zh-CN',
      debug: false,
    };

    // 发布配置加载完成事件
    globalEventBus.emit('config:loaded', {
      config: this.config,
      service: this.name,
    });
  }

  get(key: string): any {
    return this.config[key];
  }

  set(key: string, value: any): void {
    const oldValue = this.config[key];
    this.config[key] = value;

    // 发布配置变更事件
    globalEventBus.emit('config:changed', {
      key,
      oldValue,
      newValue: value,
      service: this.name,
    });
  }
}

/**
 * 使用装饰器的服务
 */
@ServiceDecorator({
  name: 'UserService',
  dependencies: ['LoggerService', 'ConfigService'],
  singleton: true,
})
class UserService implements Service {
  name = 'UserService';

  @Inject('LoggerService')
  private logger!: LoggerService;

  @Inject('ConfigService')
  private config!: ConfigService;

  private users: Map<string, any> = new Map();

  initialize() {
    this.logger.log('UserService initialized');
  }

  addUser(user: { id: string; name: string; email: string }) {
    this.users.set(user.id, user);

    this.logger.log(`User added: ${user.name} (${user.id})`);

    // 发布用户添加事件
    globalEventBus.emit('user:added', {
      user,
      timestamp: new Date(),
      service: this.name,
    });
  }

  getUser(id: string) {
    return this.users.get(id);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }
}

// ==================== 示例2: 事件监听器 ====================

/**
 * 应用状态管理器
 */
class AppStateManager {
  private unsubscribeFunctions: (() => void)[] = [];

  constructor() {
    // 使用 hooks 注册多个事件监听器
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听服务启动事件
    const unsubscribeServiceStart = useEvent(ServiceEvents.SERVICE_STARTED, (data) => {
      console.log(`Service started: ${data.serviceName}`);
    });
    this.unsubscribeFunctions.push(unsubscribeServiceStart);

    // 监听配置变更事件
    const unsubscribeConfigChange = useEvent('config:changed', (data) => {
      console.log(`Config changed: ${data.key} = ${data.newValue}`);

      // 根据配置变更更新 UI
      if (data.key === 'theme') {
        this.updateTheme(data.newValue);
      }
    });
    this.unsubscribeFunctions.push(unsubscribeConfigChange);

    // 监听用户添加事件
    const unsubscribeUserAdded = useEvent('user:added', (data) => {
      console.log(`New user: ${data.user.name} (${data.user.email})`);

      // 发送欢迎邮件（示例）
      this.sendWelcomeEmail(data.user);
    });
    this.unsubscribeFunctions.push(unsubscribeUserAdded);

    // 监听端口分配事件（使用预定义的 hooks）
    portEvents.allocated.use((data) => {
      console.log(`Port ${data.port} allocated for ${data.serviceName}`);
    });

    // 监听微服务启动事件
    microserviceEvents.started.use((data) => {
      console.log(`Microservice started: ${data.name} on port ${data.port}`);
    });
  }

  private updateTheme(theme: string) {
    console.log(`Updating UI theme to: ${theme}`);
    // 在实际应用中，这里会更新 UI 主题
  }

  private sendWelcomeEmail(user: any) {
    console.log(`Sending welcome email to ${user.email}`);
    // 在实际应用中，这里会发送邮件
  }

  cleanup() {
    // 清理所有事件监听器
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

// ==================== 示例3: 响应式配置管理 ====================

/**
 * 主题管理器（使用响应式 hooks）
 */
class ThemeManager {
  private cleanup: () => void;

  constructor() {
    // 收集清理函数
    const cleanupFunctions: (() => void)[] = [];

    // 监听主题配置
    const themeHook = useConfig('theme', 'light');
    cleanupFunctions.push(themeHook.unsubscribe);
    // 监听主题变化
    useEvent('config:updated', (data) => {
      if (data.key === 'theme') {
        console.log(`Theme changed to: ${data.value}`);
        this.applyTheme(data.value);
      }
    });

    // 监听语言配置
    const languageHook = useConfig('language', 'zh-CN');
    cleanupFunctions.push(languageHook.unsubscribe);
    // 监听语言变化
    useEvent('config:updated', (data) => {
      if (data.key === 'language') {
        console.log(`Language changed to: ${data.value}`);
        this.updateTranslations(data.value);
      }
    });

    // 监听暗黑模式
    const darkModeHook = useConfig('darkMode', false);
    cleanupFunctions.push(darkModeHook.unsubscribe);
    // 监听暗黑模式变化
    useEvent('config:updated', (data) => {
      if (data.key === 'darkMode') {
        console.log(`Dark mode: ${data.value ? 'enabled' : 'disabled'}`);
        this.toggleDarkMode(data.value);
      }
    });

    this.cleanup = () => {
      cleanupFunctions.forEach((fn) => fn());
    };
  }

  private applyTheme(theme: string) {
    // 应用主题样式
    console.log(`Applying theme: ${theme}`);
  }

  private updateTranslations(language: string) {
    // 更新翻译
    console.log(`Updating translations for: ${language}`);
  }

  private toggleDarkMode(enabled: boolean) {
    // 切换暗黑模式
    console.log(`Toggling dark mode: ${enabled}`);
  }

  destroy() {
    this.cleanup();
  }
}

// ==================== 示例4: 服务状态监控 ====================

/**
 * 服务健康检查器
 */
class ServiceHealthChecker {
  private monitoredServices = new Map<string, ReturnType<typeof useServiceStatus>>();

  monitorService(serviceName: string) {
    // 使用 useServiceStatus hook 监控服务状态
    const status = useServiceStatus(serviceName);
    this.monitoredServices.set(serviceName, status);

    console.log(`Started monitoring service: ${serviceName}`);

    // 监听服务状态变化
    useEvent('service:status', (data) => {
      if (data.serviceName === serviceName) {
        this.handleServiceStatusChange(serviceName, data);
      }
    });
  }

  private handleServiceStatusChange(serviceName: string, status: any) {
    console.log(`Service ${serviceName} status changed:`, status);

    // 根据状态采取行动
    if (status.status === 'error') {
      this.alertServiceError(serviceName, status.error);
    } else if (status.status === 'stopped') {
      this.attemptRestart(serviceName);
    }
  }

  private alertServiceError(serviceName: string, error: Error) {
    console.error(`Service ${serviceName} error:`, error.message);
    // 在实际应用中，这里会发送警报
  }

  private attemptRestart(serviceName: string) {
    console.log(`Attempting to restart service: ${serviceName}`);
    // 在实际应用中，这里会尝试重启服务
  }

  getServiceStatus(serviceName: string) {
    const monitored = this.monitoredServices.get(serviceName);
    return monitored?.status;
  }
}

// ==================== 示例5: 端口和微服务管理 ====================

/**
 * 微服务编排器
 */
class MicroserviceOrchestrator {
  private cleanup: () => void;

  constructor() {
    this.cleanup = useHooks({
      // 监听微服务创建
      microserviceCreated: () =>
        microserviceEvents.created.use((data) => {
          console.log(`Microservice created: ${data.name} at ${data.path}`);
          this.registerService(data);
        }),

      // 监听微服务启动
      microserviceStarted: () =>
        microserviceEvents.started.use((data) => {
          console.log(`Microservice started: ${data.name} (PID: ${data.pid})`);
          this.updateServiceStatus(data.name, 'running');
        }),

      // 监听微服务停止
      microserviceStopped: () =>
        microserviceEvents.stopped.use((data) => {
          console.log(`Microservice stopped: ${data.name}`);
          this.updateServiceStatus(data.name, 'stopped');
        }),

      // 监听端口分配
      portAllocated: () =>
        portEvents.allocated.use((data) => {
          console.log(`Port ${data.port} allocated for ${data.serviceName}`);
          this.updatePortMapping(data.serviceName, data.port);
        }),

      // 监听端口释放
      portReleased: () =>
        portEvents.released.use((data) => {
          console.log(`Port ${data.port} released from ${data.serviceName}`);
          this.removePortMapping(data.serviceName, data.port);
        }),
    });
  }

  private registerService(data: any) {
    // 注册新创建的服务
    console.log(`Registering service: ${data.name}`);
    // 在实际应用中，这里会更新服务注册表
  }

  private updateServiceStatus(serviceName: string, status: string) {
    // 更新服务状态
    console.log(`Updating ${serviceName} status to: ${status}`);
    // 在实际应用中，这里会更新服务状态跟踪
  }

  private updatePortMapping(serviceName: string, port: number) {
    // 更新端口映射
    console.log(`Mapping ${serviceName} to port ${port}`);
    // 在实际应用中，这里会更新端口映射表
  }

  private removePortMapping(serviceName: string, port: number) {
    // 移除端口映射
    console.log(`Removing port mapping for ${serviceName}:${port}`);
    // 在实际应用中，这里会清理端口映射
  }

  destroy() {
    this.cleanup();
  }
}

// ==================== 示例6: 集成使用示例 ====================

/**
 * 主应用类
 */
class MainApplication {
  private logger: LoggerService;
  private config: ConfigService;
  private userService: UserService;
  private appStateManager: AppStateManager;
  private themeManager: ThemeManager;
  private healthChecker: ServiceHealthChecker;
  private orchestrator: MicroserviceOrchestrator;

  constructor() {
    // 注册服务
    this.registerServices();

    // 获取服务实例
    this.logger = useService<LoggerService>('LoggerService')!;
    this.config = useService<ConfigService>('ConfigService')!;
    this.userService = useService<UserService>('UserService')!;

    // 初始化管理器
    this.appStateManager = new AppStateManager();
    this.themeManager = new ThemeManager();
    this.healthChecker = new ServiceHealthChecker();
    this.orchestrator = new MicroserviceOrchestrator();

    // 设置全局清理
    this.setupGlobalCleanup();
  }

  private registerServices() {
    // 注册基础服务
    globalServiceRegistry.register('LoggerService', {
      service: new LoggerService(),
    });

    globalServiceRegistry.register('ConfigService', {
      service: new ConfigService(),
    });

    // 装饰器会自动注册 UserService
    // 但我们也可以手动注册其他服务
  }

  private setupGlobalCleanup() {
    // 使用 useEffect 风格的处理
    useEffect(() => {
      console.log('Application mounted');

      return () => {
        console.log('Application unmounting...');

        // 清理所有资源
        this.appStateManager.cleanup();
        this.themeManager.destroy();
        this.orchestrator.destroy();

        // 销毁所有服务
        globalServiceRegistry.destroyAll();

        // 清理全局钩子
        globalHookManager.cleanupAll();
      };
    });
  }

  async start() {
    console.log('Starting application...');

    // 初始化所有服务
    await globalServiceRegistry.initializeAll();

    // 开始监控服务
    this.healthChecker.monitorService('LoggerService');
    this.healthChecker.monitorService('ConfigService');
    this.healthChecker.monitorService('UserService');

    // 执行一些操作来演示事件系统
    this.demoEvents();

    console.log('Application started successfully');
  }

  private demoEvents() {
    // 发布一些事件来演示系统
    setTimeout(() => {
      // 添加用户
      this.userService.addUser({
        id: '1',
        name: '张三',
        email: 'zhangsan@example.com',
      });

      // 更改配置
      this.config.set('theme', 'dark');
      this.config.set('language', 'en-US');

      // 模拟端口分配
      portEvents.allocated.emit({
        port: 3000,
        serviceName: 'main-app',
      });

      // 模拟微服务创建
      microserviceEvents.created.emit({
        name: 'auth-service',
        path: '/services/auth',
        port: 3001,
      });

      // 模拟微服务启动
      setTimeout(() => {
        microserviceEvents.started.emit({
          name: 'auth-service',
          port: 3001,
          pid: 12345,
        });
      }, 1000);
    }, 500);
  }

  async stop() {
    console.log('Stopping application...');

    // 触发全局清理
    globalHookManager.cleanupAll();

    console.log('Application stopped');
  }
}

// ==================== 使用示例 ====================

/**
 * 运行示例
 */
async function runExample() {
  console.log('=== Hooks System Example ===\n');

  const app = new MainApplication();

  try {
    await app.start();

    // 运行一段时间后停止
    setTimeout(async () => {
      await app.stop();
      console.log('\n=== Example completed ===');
    }, 5000);
  } catch (error) {
    console.error('Application error:', error);
    await app.stop();
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runExample().catch(console.error);
}

// 导出示例组件
export {
  LoggerService,
  ConfigService,
  UserService,
  AppStateManager,
  ThemeManager,
  ServiceHealthChecker,
  MicroserviceOrchestrator,
  MainApplication,
  runExample,
};
