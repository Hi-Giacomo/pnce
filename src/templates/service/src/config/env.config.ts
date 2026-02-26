import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

/**
 * 读取 .env 文件内容
 */
export function loadEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return {};
  }

  const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
  const envVars: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    // 跳过注释和空行
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    // 解析 KEY=VALUE 格式
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=');
    
    if (key) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  return envVars;
}

/**
 * 写入 .env 文件
 */
export function saveEnvFile(envVars: Record<string, string>): void {
  const lines: string[] = [];
  
  Object.entries(envVars).forEach(([key, value]) => {
    // 如果值中包含空格或特殊字符，需要用引号包裹
    const needsQuotes = value.includes(' ') || value.includes('#') || value.includes('"');
    const formattedValue = needsQuotes ? `"${value}"` : value;
    lines.push(`${key}=${formattedValue}`);
  });
  
  fs.writeFileSync(ENV_FILE_PATH, lines.join('\n') + '\n', 'utf-8');
}

/**
 * 更新单个环境变量
 */
export function updateEnvFile(key: string, value: string): void {
  const currentVars = loadEnvFile();
  currentVars[key] = value;
  saveEnvFile(currentVars);
  
  // 更新 process.env 使其立即生效
  process.env[key] = value;
}

/**
 * 删除环境变量
 */
export function deleteEnvFile(key: string): void {
  const currentVars = loadEnvFile();
  delete currentVars[key];
  saveEnvFile(currentVars);
  
  // 从 process.env 中删除
  delete process.env[key];
}

export default registerAs('env', () => {
  // 从 .env 文件加载配置
  const envVars = loadEnvFile();
  
  return {
    app: {
      port: parseInt(envVars.PORT || process.env.PORT || '3000', 10),
      env: envVars.NODE_ENV || process.env.NODE_ENV || 'development',
    }
  };
});
