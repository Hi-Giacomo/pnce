/**
 * Hooks 系统入口文件
 * 导出所有相关功能，方便项目集成
 */

// 事件总线
export {
  EventBus,
  globalEventBus,
  ServiceEvents,
  type EventType,
  type EventHandler,
  type EventListener,
} from './event-bus';

// 服务注册表
export {
  ServiceRegistry,
  globalServiceRegistry,
  type Service,
  type ServiceStatus,
  type ServiceRegistration,
  type ServiceFactory,
  ServiceDecorator,
  Inject,
} from './service-registry';

// Hooks 系统
export {
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

// 快速集成工具
export * from './hooks-integration';

// 重新导出端口工具（如果存在）
// 注意：动态导出在 TypeScript 中不可用，我们只在类型安全的情况下导出
// export { default as portUtils } from './port.utils';