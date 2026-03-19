import * as path from 'path';
import * as fs from 'fs-extra';
import * as net from 'net';

/**
 * 端口管理服务
 * 负责为微服务分配唯一端口号
 */
export class PortManagerService {
  private static readonly PORT_CACHE_FILE = '.pnce-port-cache.json';
  private static readonly BASE_PORT = 3001; // 起始端口
  private static readonly MAX_PORT = 3999; // 最大端口

  /**
   * 递归向上查找服务并分配端口
   * @param targetDir 目标微服务目录
   * @param moduleName 微服务名称
   * @returns 分配的端口号
   */
  static async allocatePort(targetDir: string, moduleName: string): Promise<number> {
    const portCachePath = this.getPortCachePath(targetDir);
    const allocatedPorts = await this.loadAllocatedPorts(portCachePath);

    // 查找已分配给该模块的端口
    const existingPort = this.findPortForModule(allocatedPorts, moduleName);
    if (existingPort) {
      console.log(`✓ 已分配端口: ${existingPort} for ${moduleName}`);
      return existingPort;
    }

    // 查找第一个可用的端口
    const availablePort = await this.findAvailablePort(allocatedPorts);

    // 更新模块的端口配置
    await this.updateModuleConfig(targetDir, availablePort);

    // 更新端口缓存
    allocatedPorts[moduleName] = availablePort;
    await this.savePortCache(portCachePath, allocatedPorts);

    console.log(`✓ 分配端口: ${availablePort} for ${moduleName}`);
    return availablePort;
  }

  /**
   * 获取端口缓存文件路径
   */
  private static getPortCachePath(targetDir: string): string {
    // 递归向上查找最近的服务目录
    // 优先查找 type: "service" 的目录，如果没有则查找 type: "microservice" 的目录
    let currentDir = targetDir;
    let serviceDir: string | null = null;
    let microserviceDir: string | null = null;

    while (currentDir !== path.dirname(currentDir)) {
      const moduleConfigPath = path.join(currentDir, 'module.config.json');
      if (fs.existsSync(moduleConfigPath)) {
        const config = fs.readJsonSync(moduleConfigPath);
        if (config.type === 'service') {
          // 找到主服务，直接使用
          serviceDir = currentDir;
          break;
        } else if (config.type === 'microservice' && !microserviceDir) {
          // 记录找到的第一个微服务（最近的微服务）
          microserviceDir = currentDir;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    // 如果没有找到主服务，使用最近的微服务
    const targetServiceDir = serviceDir || microserviceDir;

    if (!targetServiceDir) {
      throw new Error('无法找到服务目录（service 或 microservice）');
    }

    return path.join(targetServiceDir, this.PORT_CACHE_FILE);
  }

  /**
   * 加载已分配的端口
   */
  private static async loadAllocatedPorts(portCachePath: string): Promise<Record<string, number>> {
    if (fs.existsSync(portCachePath)) {
      return await fs.readJson(portCachePath);
    }
    return {};
  }

  /**
   * 查找已分配给模块的端口
   */
  private static findPortForModule(
    allocatedPorts: Record<string, number>,
    moduleName: string
  ): number | null {
    return allocatedPorts[moduleName] || null;
  }

  /**
   * 查找第一个可用的端口
   */
  private static async findAvailablePort(allocatedPorts: Record<string, number>): Promise<number> {
    const usedPorts = Object.values(allocatedPorts);

    for (let port = this.BASE_PORT; port <= this.MAX_PORT; port++) {
      if (!usedPorts.includes(port) && (await this.isPortAvailable(port))) {
        return port;
      }
    }

    throw new Error('没有可用的端口（3001-3999 已用完）');
  }

  /**
   * 检查端口是否可用（未被占用）
   */
  private static async isPortAvailable(port: number): Promise<boolean> {
    try {
      const net = require('net');
      return new Promise<boolean>((resolve) => {
        const server = net.createServer();

        server.once('error', () => {
          server.close();
          resolve(false);
        });

        server.once('listening', () => {
          server.close();
          resolve(true);
        });

        server.listen(port, '0.0.0.0');
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 更新模块的端口配置
   */
  private static async updateModuleConfig(targetDir: string, port: number): Promise<void> {
    const moduleConfigPath = path.join(targetDir, 'module.config.json');

    if (!fs.existsSync(moduleConfigPath)) {
      throw new Error(`未找到 module.config.json: ${moduleConfigPath}`);
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    moduleConfig.port = port;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  /**
   * 保存端口缓存
   */
  private static async savePortCache(
    portCachePath: string,
    allocatedPorts: Record<string, number>
  ): Promise<void> {
    await fs.writeJson(portCachePath, allocatedPorts, { spaces: 2 });
  }

  /**
   * 获取模块的端口
   */
  static async getModulePort(targetDir: string): Promise<number | null> {
    const moduleConfigPath = path.join(targetDir, 'module.config.json');

    if (!fs.existsSync(moduleConfigPath)) {
      return null;
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    return moduleConfig.port || null;
  }

  /**
   * 清理端口映射中的无效端口
   * @param serviceDir 服务目录路径
   */
  static async cleanupPortMappings(serviceDir: string): Promise<void> {
    const portCachePath = path.join(serviceDir, this.PORT_CACHE_FILE);

    if (!fs.existsSync(portCachePath)) {
      return;
    }

    const allocatedPorts = await this.loadAllocatedPorts(portCachePath);
    const validPorts: Record<string, number> = {};
    let cleanedCount = 0;

    console.log('\n🧹 清理端口映射...');

    for (const [moduleName, port] of Object.entries(allocatedPorts)) {
      // 检查端口是否被占用
      if (await this.isPortActuallyInUse(port)) {
        // 端口被占用，检查对应的微服务是否存在
        const modulePath = path.join(serviceDir, 'src', 'local_modules', moduleName);
        const moduleConfigPath = path.join(modulePath, 'module.config.json');

        if (fs.existsSync(moduleConfigPath)) {
          try {
            const config = await fs.readJson(moduleConfigPath);
            if (config.type === 'microservice' && config.port === port) {
              // 微服务存在且端口匹配，保留
              validPorts[moduleName] = port;
              console.log(`✓ 保留端口映射: ${moduleName} -> ${port}`);
            } else {
              // 微服务配置不匹配，清理
              cleanedCount++;
              console.log(`🗑️  清理无效端口映射: ${moduleName} -> ${port} (配置不匹配)`);
            }
          } catch (error) {
            // 无法读取配置，清理
            cleanedCount++;
            console.log(`🗑️  清理无效端口映射: ${moduleName} -> ${port} (读取配置失败)`);
          }
        } else {
          // 微服务不存在，清理
          cleanedCount++;
          console.log(`🗑️  清理无效端口映射: ${moduleName} -> ${port} (微服务不存在)`);
        }
      } else {
        // 端口未被占用，清理
        cleanedCount++;
        console.log(`🗑️  清理无效端口映射: ${moduleName} -> ${port} (端口未占用)`);
      }
    }

    // 更新端口缓存文件
    if (cleanedCount > 0) {
      await this.savePortCache(portCachePath, validPorts);
      console.log(`✅ 端口映射清理完成，清理了 ${cleanedCount} 个无效映射`);
    } else {
      console.log('✅ 端口映射无需清理');
    }
  }

  /**
   * 检查端口是否实际被占用
   */
  private static async isPortActuallyInUse(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const server = net.createServer();

      server.once('error', () => {
        server.close();
        resolve(true); // 端口被占用
      });

      server.once('listening', () => {
        server.close();
        resolve(false); // 端口可用
      });

      server.listen(port, '0.0.0.0');
    });
  }
}
