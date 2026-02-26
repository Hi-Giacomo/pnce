/**
 * 环境变量基础类型
 * 定义所有支持的环境变量及其类型
 */
export type EnvVars = {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
};

/**
 * 为 process.env 添加类型提示
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVars {}
  }
}

export {};
