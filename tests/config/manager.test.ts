import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/config/manager';
import fs from 'fs-extra';
import path from 'path';

describe('ConfigManager', () => {
  const testConfigDir = path.join(process.cwd(), '.pnce-test');
  const testConfigFile = path.join(testConfigDir, 'config.json');

  beforeEach(async () => {
    // 确保测试目录存在
    await fs.ensureDir(testConfigDir);
  });

  afterEach(async () => {
    // 清理测试配置文件
    if (await fs.pathExists(testConfigFile)) {
      await fs.remove(testConfigFile);
    }
  });

  it('should create config manager instance', async () => {
    const manager = new ConfigManager();
    expect(manager).toBeDefined();
  });

  it('should load config with default values', async () => {
    const manager = new ConfigManager();
    const config = manager.getConfig();

    expect(config).toBeDefined();
    expect(config.apiServer).toBeDefined();
    expect(config.oauthEndpoint).toBeDefined();
    expect(config.outputDir).toBeDefined();
  });
});
