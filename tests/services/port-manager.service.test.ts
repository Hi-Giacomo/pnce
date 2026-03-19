import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { PortManagerService } from '../../src/services/port-manager.service';

describe('PortManagerService', () => {
  let testDir: string;
  let serviceDir: string;
  let microserviceDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pnce-port-test-'));
    serviceDir = path.join(testDir, 'service');
    microserviceDir = path.join(serviceDir, 'src', 'local_modules', 'ms1');

    // 创建服务目录和配置
    await fs.ensureDir(microserviceDir);

    // 创建服务的 module.config.json
    const serviceConfig = {
      name: 'test-service',
      description: 'Test service',
      author: 'test',
      version: '1.0.0',
      type: 'service',
      appId: '',
      teamId: '',
      installedModules: {},
    };
    await fs.writeJson(path.join(serviceDir, 'module.config.json'), serviceConfig, { spaces: 2 });

    // 创建微服务的 module.config.json
    const msConfig = {
      name: 'ms1',
      description: 'Test microservice',
      author: 'test',
      version: '0.0.1',
      type: 'microservice',
      appId: '',
      teamId: '',
      port: null,
    };
    await fs.writeJson(path.join(microserviceDir, 'module.config.json'), msConfig, { spaces: 2 });
  });

  afterEach(async () => {
    // 清理测试目录
    if (testDir && fs.existsSync(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('allocatePort', () => {
    it('应该为微服务分配一个可用的端口', async () => {
      const port = await PortManagerService.allocatePort(microserviceDir, 'ms1');

      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3999);

      // 验证端口已写入 module.config.json
      const msConfig = await fs.readJson(path.join(microserviceDir, 'module.config.json'));
      expect(msConfig.port).toBe(port);

      // 验证缓存文件已创建
      const cacheFile = path.join(serviceDir, '.pnce-port-cache.json');
      expect(fs.existsSync(cacheFile)).toBe(true);

      const cache = await fs.readJson(cacheFile);
      expect(cache.ms1).toBe(port);
    });

    it('应该为同一个微服务返回已分配的端口', async () => {
      const port1 = await PortManagerService.allocatePort(microserviceDir, 'ms1');
      const port2 = await PortManagerService.allocatePort(microserviceDir, 'ms1');

      expect(port1).toBe(port2);
    });

    it('应该为不同的微服务分配不同的端口', async () => {
      // 创建第二个微服务
      const ms2Dir = path.join(serviceDir, 'src', 'local_modules', 'ms2');
      await fs.ensureDir(ms2Dir);
      const ms2Config = {
        name: 'ms2',
        description: 'Test microservice 2',
        author: 'test',
        version: '0.0.1',
        type: 'microservice',
        appId: '',
        teamId: '',
        port: null,
      };
      await fs.writeJson(path.join(ms2Dir, 'module.config.json'), ms2Config, { spaces: 2 });

      const port1 = await PortManagerService.allocatePort(microserviceDir, 'ms1');
      const port2 = await PortManagerService.allocatePort(ms2Dir, 'ms2');

      expect(port1).not.toBe(port2);
    });

    it('应该正确找到嵌套微服务的父服务目录', async () => {
      // 创建嵌套的微服务
      const nestedDir = path.join(microserviceDir, 'src', 'local_modules', 'nested-ms');
      await fs.ensureDir(nestedDir);
      const nestedConfig = {
        name: 'nested-ms',
        description: 'Nested microservice',
        author: 'test',
        version: '0.0.1',
        type: 'microservice',
        appId: '',
        teamId: '',
        port: null,
      };
      await fs.writeJson(path.join(nestedDir, 'module.config.json'), nestedConfig, { spaces: 2 });

      const port = await PortManagerService.allocatePort(nestedDir, 'nested-ms');

      // 验证端口分配成功
      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3999);

      // 验证缓存文件在服务目录中（而不是嵌套微服务中）
      const cacheFile = path.join(serviceDir, '.pnce-port-cache.json');
      expect(fs.existsSync(cacheFile)).toBe(true);
    });
  });

  describe('getModulePort', () => {
    it('应该返回模块配置的端口', async () => {
      await PortManagerService.allocatePort(microserviceDir, 'ms1');
      const port = await PortManagerService.getModulePort(microserviceDir);

      expect(port).toBeGreaterThan(0);
    });

    it('如果模块没有配置端口应该返回 null', async () => {
      const port = await PortManagerService.getModulePort(microserviceDir);
      expect(port).toBeNull();
    });
  });
});
