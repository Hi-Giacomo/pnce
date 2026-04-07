/**
 * Hooks 系统演示
 * 展示如何在你的 pnce 项目中使用 hooks 系统实现即时事件通信
 */

import {
  globalEventBus,
  globalServiceRegistry,
  useEvent,
  useService,
  useEmit,
  useConfig,
  type Service,
} from './index';

// ==================== 演示1: 基本事件通信 ====================

console.log('=== 演示1: 基本事件通信 ===');

// 定义服务
class NotificationService {
  name = 'NotificationService';

  sendNotification(message: string) {
    console.log(`📢 发送通知: ${message}`);

    // 发布通知事件
    globalEventBus.emit('notification:sent', {
      message,
      timestamp: new Date(),
      service: this.name,
    });
  }
}

// 注册服务
globalServiceRegistry.register('NotificationService', {
  service: new NotificationService(),
});

// 监听通知事件
useEvent('notification:sent', (data) => {
  console.log(`🎯 立即收到通知: "${data.message}"`);
  console.log(`   时间: ${data.timestamp.toISOString()}`);
});

// 获取服务并发送通知
const notificationService = useService<NotificationService>('NotificationService');
notificationService?.sendNotification('系统启动完成！');

console.log('');

// ==================== 演示2: 配置热重载 ====================

console.log('=== 演示2: 配置热重载 ===');

// 使用配置钩子
const { config: theme, setConfig: setTheme } = useConfig('theme', 'light');
console.log(`当前主题: ${theme}`);

// 监听主题变化
useEvent('config:updated', (data) => {
  if (data.key === 'theme') {
    console.log(`🔄 主题从 "${data.oldValue}" 切换到 "${data.newValue}"`);
    console.log(`   切换时间: ${data.timestamp.toISOString()}`);
  }
});

// 发布事件钩子
const emit = useEmit();

// 模拟用户操作：切换主题
setTimeout(() => {
  setTheme('dark');

  // 发布自定义事件
  emit('ui:theme:changed', {
    from: 'light',
    to: 'dark',
    user: 'admin',
  });
}, 1000);

// 监听UI主题变化
useEvent('ui:theme:changed', (data) => {
  console.log(`🎨 UI主题变化: ${data.user} 将主题从 ${data.from} 改为 ${data.to}`);
});

console.log('');

// ==================== 演示3: 微服务集成示例 ====================

console.log('=== 演示3: 微服务集成 ===');

// 模拟微服务管理器
class MicroserviceManager implements Service {
  name = 'MicroserviceManager';
  private services = new Map<string, any>();

  createService(name: string, port: number) {
    console.log(`🚀 创建微服务: ${name} (端口: ${port})`);

    const service = { name, port, pid: Date.now() };
    this.services.set(name, service);

    // 发布微服务创建事件
    globalEventBus.emit('microservice:created', {
      name,
      port,
      timestamp: new Date(),
    });

    return service;
  }

  startService(name: string) {
    const service = this.services.get(name);
    if (!service) return null;

    console.log(`✅ 启动微服务: ${name} (PID: ${service.pid})`);

    // 发布微服务启动事件
    globalEventBus.emit('microservice:started', {
      name,
      port: service.port,
      pid: service.pid,
      timestamp: new Date(),
    });

    return service;
  }
}

// 创建并注册微服务管理器
const microserviceManager = new MicroserviceManager();
globalServiceRegistry.register('MicroserviceManager', {
  service: microserviceManager,
});

// 监听微服务事件
useEvent('microservice:created', (data) => {
  console.log(`📡 监听到微服务创建: ${data.name} 在端口 ${data.port}`);

  // 自动启动微服务（模拟）
  setTimeout(() => {
    microserviceManager.startService(data.name);
  }, 500);
});

useEvent('microservice:started', (data) => {
  console.log(`📡 监听到微服务启动: ${data.name} (PID: ${data.pid})`);

  // 这里可以更新监控面板、日志记录等
});

// 创建一些微服务
setTimeout(() => {
  microserviceManager.createService('auth-service', 3001);
}, 1500);

setTimeout(() => {
  microserviceManager.createService('user-service', 3002);
}, 2000);

// ==================== 演示4: 端口管理集成 ====================

console.log('\n=== 演示4: 端口管理 ===');

// 监听端口事件
useEvent('port:allocated', (data) => {
  console.log(`🔌 端口分配: ${data.port} -> ${data.serviceName}`);

  // 这里可以更新端口映射表
});

useEvent('port:released', (data) => {
  console.log(`🔌 端口释放: ${data.port} <- ${data.serviceName}`);

  // 这里可以清理端口资源
});

// 模拟端口分配和释放
setTimeout(() => {
  globalEventBus.emit('port:allocated', {
    port: 3000,
    serviceName: 'main-app',
    timestamp: new Date(),
  });
}, 2500);

setTimeout(() => {
  globalEventBus.emit('port:released', {
    port: 3000,
    serviceName: 'main-app',
    timestamp: new Date(),
  });
}, 3000);

// ==================== 演示5: 服务依赖和通信 ====================

console.log('\n=== 演示5: 服务依赖 ===');

class DatabaseService {
  name = 'DatabaseService';

  query(sql: string) {
    console.log(`🗄️  数据库查询: ${sql}`);

    // 发布查询事件
    globalEventBus.emit('database:query', {
      sql,
      timestamp: new Date(),
    });

    return { rows: [{ id: 1, name: '测试数据' }] };
  }
}

class ApiService {
  name = 'ApiService';

  constructor() {
    // 监听数据库查询事件
    useEvent('database:query', (data) => {
      console.log(`🌐 API服务监听到数据库查询: "${data.sql}"`);
      // 这里可以记录日志、更新缓存等
    });
  }

  getUsers() {
    console.log('🌐 API服务: 获取用户列表');

    // 获取数据库服务
    const dbService = useService<DatabaseService>('DatabaseService');
    if (!dbService) {
      console.log('❌ 数据库服务不可用');
      return [];
    }

    // 执行查询
    const result = dbService.query('SELECT * FROM users');

    // 发布API调用完成事件
    globalEventBus.emit('api:users:fetched', {
      count: result.rows.length,
      timestamp: new Date(),
    });

    return result.rows;
  }
}

// 注册服务（注意顺序：先注册被依赖的服务）
globalServiceRegistry.register('DatabaseService', {
  service: new DatabaseService(),
});

globalServiceRegistry.register('ApiService', {
  service: new ApiService(),
});

// 监听API事件
useEvent('api:users:fetched', (data) => {
  console.log(`📊 用户数据获取完成: ${data.count} 条记录`);
});

// 测试服务调用
setTimeout(() => {
  const apiService = useService<ApiService>('ApiService');
  apiService?.getUsers();
}, 3500);

// ==================== 清理和总结 ====================

console.log('\n=== 演示完成 ===');
console.log('等待所有事件处理完成...');

// 等待所有异步操作完成
setTimeout(() => {
  console.log('\n✅ 所有演示完成！');
  console.log('\n📋 总结:');
  console.log('1. 事件发布后，订阅者立即收到通知');
  console.log('2. 服务可以通过 hooks 轻松获取');
  console.log('3. 配置变更可以实时响应');
  console.log('4. 微服务和端口管理可以无缝集成');
  console.log('5. 服务间依赖和通信非常简单');

  process.exit(0);
}, 5000);
