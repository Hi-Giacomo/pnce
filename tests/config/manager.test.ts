import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/config/manager';
import fs from 'fs-extra';
import path from 'path';

describe('ConfigManager', () => {
  const testConfigDir = path.join(process.cwd(), '.pnce-test');
  const testConfigfile = path.join(testConfigDir, 'config.json');

  beforeEach(async () => {
    // TestDirectory
    await fs.ensureDir(testConfigDir);
  });

  afterEach(async () => {
    // CleanTestConfigurefile
    if (await fs.pathExists(testConfigfile)) {
      await fs.remove(testConfigfile);
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
