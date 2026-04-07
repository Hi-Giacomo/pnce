/**
 * 事件总线系统
 * 支持类型安全的发布-订阅模式，让服务之间可以即时通信
 */

// 事件类型定义
export type EventType = string | symbol;

// 事件回调函数类型
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

// 事件监听器接口
export interface EventListener<T = any> {
  handler: EventHandler<T>;
  once?: boolean;
}

// 事件总线类
export class EventBus {
  private listeners: Map<EventType, EventListener[]> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  on<T = any>(event: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener: EventListener<T> = { handler };
    this.listeners.get(event)!.push(listener as EventListener);

    // 返回取消订阅的函数
    return () => this.off(event, handler);
  }

  /**
   * 订阅一次性事件（只触发一次）
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  once<T = any>(event: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener: EventListener<T> = { handler, once: true };
    this.listeners.get(event)!.push(listener as EventListener);

    // 返回取消订阅的函数
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param handler 要移除的处理函数（可选，不传则移除该事件所有监听器）
   */
  off<T = any>(event: EventType, handler?: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      return;
    }

    if (!handler) {
      // 移除该事件的所有监听器
      this.listeners.delete(event);
      return;
    }

    // 移除指定的监听器
    const eventListeners = this.listeners.get(event)!;
    const index = eventListeners.findIndex(listener => listener.handler === handler);
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }

    // 如果该事件没有监听器了，清理 Map
    if (eventListeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T = any>(event: EventType, data?: T): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const eventListeners = this.listeners.get(event)!;
    const listenersToRemove: EventListener[] = [];

    // 遍历所有监听器
    for (const listener of eventListeners) {
      try {
        // 执行事件处理函数
        const result = listener.handler(data);
        
        // 如果是 Promise，捕获可能的错误但不阻塞其他监听器
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Event handler error for event "${String(event)}":`, error);
          });
        }

        // 如果是一次性事件，标记为待移除
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`Event handler error for event "${String(event)}":`, error);
      }
    }

    // 移除一次性事件的监听器
    if (listenersToRemove.length > 0) {
      const remainingListeners = eventListeners.filter(
        listener => !listenersToRemove.includes(listener)
      );
      
      if (remainingListeners.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, remainingListeners);
      }
    }
  }

  /**
   * 异步发布事件（等待所有异步处理函数完成）
   * @param event 事件名称
   * @param data 事件数据
   */
  async emitAsync<T = any>(event: EventType, data?: T): Promise<void> {
    if (!this.listeners.has(event)) {
      return;
    }

    const eventListeners = this.listeners.get(event)!;
    const listenersToRemove: EventListener[] = [];
    const promises: Promise<void>[] = [];

    // 收集所有异步处理
    for (const listener of eventListeners) {
      try {
        const result = listener.handler(data);
        
        if (result instanceof Promise) {
          promises.push(result.catch(error => {
            console.error(`Event handler error for event "${String(event)}":`, error);
          }));
        }

        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`Event handler error for event "${String(event)}":`, error);
      }
    }

    // 等待所有异步处理完成
    await Promise.all(promises);

    // 移除一次性事件的监听器
    if (listenersToRemove.length > 0) {
      const remainingListeners = eventListeners.filter(
        listener => !listenersToRemove.includes(listener)
      );
      
      if (remainingListeners.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, remainingListeners);
      }
    }
  }

  /**
   * 检查事件是否有监听器
   * @param event 事件名称
   */
  has(event: EventType): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.length > 0;
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   */
  listenerCount(event: EventType): number {
    return this.listeners.has(event) ? this.listeners.get(event)!.length : 0;
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取所有已注册的事件名称
   */
  get eventNames(): EventType[] {
    return Array.from(this.listeners.keys());
  }
}

// 全局事件总线实例
export const globalEventBus = new EventBus();

// 服务事件类型常量（可以根据需要扩展）
export const ServiceEvents = {
  // 服务生命周期事件
  SERVICE_STARTED: 'service:started',
  SERVICE_STOPPED: 'service:stopped',
  SERVICE_ERROR: 'service:error',
  
  // 端口管理事件
  PORT_ALLOCATED: 'port:allocated',
  PORT_RELEASED: 'port:released',
  
  // 配置变更事件
  CONFIG_UPDATED: 'config:updated',
  
  // 微服务相关事件
  MICROSERVICE_CREATED: 'microservice:created',
  MICROSERVICE_STARTED: 'microservice:started',
  MICROSERVICE_STOPPED: 'microservice:stopped',
} as const;