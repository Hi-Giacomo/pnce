import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

/**
 *  .env file
 */
export function loadEnvfile(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return {};
  }

  const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
  const envVars: Record<string, string> = {};

  content.split('\n').forEach((line) => {
    //
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    //  KEY=VALUE
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=');

    if (key) {
      envVars[key.trim()] = value.trim();
    }
  });

  return envVars;
}

/**
 *  .env file
 */
export function saveEnvfile(envVars: Record<string, string>): void {
  const lines: string[] = [];

  Object.entries(envVars).forEach(([key, value]) => {
    // ，
    const needsQuotes = value.includes(' ') || value.includes('#') || value.includes('"');
    const formattedValue = needsQuotes ? `"${value}"` : value;
    lines.push(`${key}=${formattedValue}`);
  });

  fs.writeFileSync(ENV_FILE_PATH, lines.join('\n') + '\n', 'utf-8');
}

/**
 * Environment variables
 */
export function updateEnvfile(key: string, value: string): void {
  const currentVars = loadEnvfile();
  currentVars[key] = value;
  saveEnvfile(currentVars);

  //  process.env
  process.env[key] = value;
}

/**
 * Environment variables
 */
export function deleteEnvfile(key: string): void {
  const currentVars = loadEnvfile();
  delete currentVars[key];
  saveEnvfile(currentVars);

  //  process.env
  delete process.env[key];
}

export default registerAs('env', () => {
  //  .env file
  const envVars = loadEnvfile();

  return {
    app: {
      port: parseInt(envVars.PORT || process.env.PORT || '3000', 10),
      env: envVars.NODE_ENV || process.env.NODE_ENV || 'development',
    },
  };
});
