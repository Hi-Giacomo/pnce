/**
 * Hooks 系统快速开始指南
 * 在现有项目中快速集成和使用 hooks 系统
 */

import {
  // 事件总线
  globalEventBus,

  // 服务注册表
  globalServiceRegistry,

  // Hooks API
  useEvent,
  useService,
  useEmit,
  useConfig,

  // 集成工具
  autoIntegrateProject,
  initializeHooksSystem,
} from './index';

// ==================== 步骤1: 集成现有项目 ====================

/**
 * 假设这是你现有的项目
 */
const existingProject = {
  name: 'MyPNCEProject',

  // 现有的微服务管理器（如果有）
  microserviceManager: {
    createMicroservice(name: string, port: number) {
      console.log(`Creating microservice ${name} on port ${port}`);
      return { name, port, pid: Date.now() };
    },

    startMicroservice(name: string) {
      console.log(`Starting microservice ${name}`);
      return { name, status: 'running' };
    },
  },

  // 现有的端口管理器（如果有）
  portManager: {
    allocatePort(serviceName: string) {
      const port = 3000 + Math.floor(Math.random() * 100);
      console.log(`Allocated port ${port} for ${serviceName}`);
      return port;
    },

    releasePort(serviceName: string) {
      console.log(`Released port for ${serviceName}`);
      return true;
    },
  },

  // 现有的配置（如果有）
  config: {
    theme: 'light',
    language: 'zh-CN',
  },
};

// 自动集成现有项目
autoIntegrateProject(existingProject);

// ==================== 步骤2: 创建自己的服务 ====================

/**
 * 用户服务
 */
class UserService {
  name = 'UserService';
  private users = new Map<string, any>();

  initialize() {
    console.log('UserService initialized');
  }

  addUser(user: { id: string; name: string; email: string }) {
    this.users.set(user.id, user);

    // 发布用户添加事件
    globalEventBus.emit('user:added', {
      user,
      timestamp: new Date(),
      service: this.name,
    });

    console.log(`User added: ${user.name}`);
    return user;
  }

  getUser(id: string) {
    return this.users.get(id);
  }
}

/**
 * 日志服务
 */
class LogService {
  name = 'LogService';

  log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const logEntry = {
      message,
      level,
      timestamp: new Date(),
      service: this.name,
    };

    console.log(`[${level.toUpperCase()}] ${message}`);

    // 发布日志事件
    globalEventBus.emit('log:entry', logEntry);
  }
}

// 注册服务
globalServiceRegistry.register('UserService', {
  service: new UserService(),
  singleton: true,
});

globalServiceRegistry.register('LogService', {
  service: new LogService(),
  singleton: true,
});

// ==================== 步骤3: 使用 Hooks API ====================

/**
 * 用户管理组件
 */
function UserManagement() {
  // 获取服务
  const userService = useService<UserService>('UserService');
  const logService = useService<LogService>('LogService');

  // 使用配置
  const { config: theme } = useConfig('theme', 'light');

  // 发布事件
  const emit = useEmit();

  // 监听用户添加事件
  useEvent('user:added', (data) => {
    console.log('New user event received:', data.user.name);
    logService?.log(`New user registered: ${data.user.name}`);
  });

  // 监听日志事件
  useEvent('log:entry', (log) => {
    // 可以在这里实现日志聚合、发送到远程服务器等
    if (log.level === 'error') {
      console.error('Error log detected:', log.message);
    }
  });

  const handleAddUser = () => {
    if (!userService) return;

    const newUser = {
      id: Date.now().toString(),
      name: `用户${Math.random().toString(36).substr(2, 5)}`,
      email: `user${Math.random().toString(36).substr(2, 5)}@example.com`,
    };

    userService.addUser(newUser);

    // 发布自定义事件
    emit('ui:user:added', {
      user: newUser,
      theme,
      timestamp: new Date(),
    });
  };

  return {
    handleAddUser,
    theme,
  };
}

/**
 * 端口监控组件
 */
function PortMonitor() {
  // 监听端口事件
  useEvent('port:allocated', (data) => {
    console.log(`🎯 Port ${data.port} allocated for ${data.serviceName}`);
  });

  useEvent('port:released', (data) => {
    console.log(`🔄 Port ${data.port} released from ${data.serviceName}`);
  });

  // 监听微服务事件
  useEvent('microservice:created', (data) => {
    console.log(`🚀 Microservice created: ${data.name} (port: ${data.port})`);
  });

  useEvent('microservice:started', (data) => {
    console.log(`✅ Microservice started: ${data.name} (PID: ${data.pid})`);
  });

  useEvent('microservice:stopped', (data) => {
    console.log(`⏹️ Microservice stopped: ${data.name}`);
  });
}

// ==================== 步骤4: 初始化系统 ====================

/**
 * 主应用
 */
class MainApp {
  private cleanup: () => void;

  constructor() {
    // 初始化 hooks 系统
    this.cleanup = initializeHooksSystem({
      autoCleanup: true,
      logEvents: true, // 开启事件日志
      defaultServices: {
        // 可以在这里添加默认服务
      },
    });

    // 初始化组件
    this.initializeComponents();
  }

  private initializeComponents() {
    // 创建组件实例
    const userManagement = UserManagement();
    const portMonitor = PortMonitor();

    // 模拟一些操作
    setTimeout(() => {
      console.log('\n=== 演示开始 ===\n');

      // 添加用户
      userManagement.handleAddUser();

      // 模拟端口分配
      globalEventBus.emit('port:allocated', {
        port: 3000,
        serviceName: 'main-app',
      });

      // 模拟微服务创建
      globalEventBus.emit('microservice:created', {
        name: 'auth-service',
        path: '/services/auth',
        port: 3001,
      });

      setTimeout(() => {
        globalEventBus.emit('microservice:started', {
          name: 'auth-service',
          port: 3001,
          pid: 12345,
        });
      }, 1000);

      // 更改配置
      globalEventBus.emit('config:updated', {
        key: 'theme',
        oldValue: 'light',
        newValue: 'dark',
      });

      setTimeout(() => {
        console.log('\n=== 演示结束 ===\n');
        this.stop();
      }, 3000);
    }, 500);
  }

  async start() {
    console.log('Starting application with hooks system...');

    // 初始化所有服务
    await globalServiceRegistry.initializeAll();

    console.log('Application started successfully');
  }

  stop() {
    console.log('Stopping application...');
    this.cleanup();
    console.log('Application stopped');
  }
}

// ==================== 运行示例 ====================

async function runQuickStart() {
  console.log('=== Hooks 系统快速开始 ===\n');

  const app = new MainApp();

  try {
    await app.start();
  } catch (error) {
    console.error('Application error:', error);
    app.stop();
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runQuickStart().catch(console.error);
}

// 导出快速开始工具
export { UserService, LogService, UserManagement, PortMonitor, MainApp, runQuickStart };
