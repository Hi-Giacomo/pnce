/**
 * Environment variablesType
 * AllEnvironment variablesType
 */
export type EnvVars = {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
};

/**
 *  process.env TypeHint
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVars {}
  }
}

export {};
