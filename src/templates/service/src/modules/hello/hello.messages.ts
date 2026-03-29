/**
 * 微服务消息模式配置
 * 用于主服务调用微服务时使用
 *
 * JHJ: 需要公共自动化
 */

// Hello 微服务的消息模式
export const HELLO_MSG = {
  world: 'hello.world',
  ping: 'hello.ping',
  info: 'hello.info',
} as const;
