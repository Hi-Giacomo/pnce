/**
 * 消息模式配置
 * 在此定义本控制器的所有消息模式，自动添加前缀
 */

// 控制器消息前缀
const MSG_PREFIX = 'hello';

/**
 * 消息模式辅助函数
 */
function msg(pattern: string): string {
  return `${MSG_PREFIX}.${pattern}`;
}

/**
 * 消息模式常量
 * 使用方法：@MessagePattern(MSG.helloWorld)
 */
export const MSG = {
  world: msg('world'), // → 'hello.world'
  ping: msg('ping'), // → 'hello.ping'
  info: msg('info'), // → 'hello.info'
  // 添加更多消息模式...
} as const;
