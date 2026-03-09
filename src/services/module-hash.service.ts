import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * 模块哈希服务
 * 负责计算和验证模块文件的完整性
 */
export class ModuleHashService {
  /**
   * 计算目录的哈希值（递归计算所有文件的哈希）
   * @param dirPath 目录路径
   * @returns SHA256哈希值
   */
  async calculateDirectoryHash(dirPath: string): Promise<string> {
    const hash = crypto.createHash('sha256');

    await this.walkDirectory(dirPath, (filePath) => {
      const content = fs.readFileSync(filePath);
      hash.update(content);
    });

    return hash.digest('hex');
  }

  /**
   * 计算文件的哈希值
   * @param filePath 文件路径
   * @returns SHA256哈希值
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 验证文件的哈希值
   * @param filePath 文件路径
   * @param expectedHash 期望的哈希值
   * @returns 是否匹配
   */
  async verifyFileHash(filePath: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateFileHash(filePath);
    return actualHash === expectedHash;
  }

  /**
   * 读取已安装模块的哈希值
   * @param modulePath 模块路径
   * @returns 哈希值或null
   */
  async readInstalledModuleHash(modulePath: string): Promise<string | null> {
    const hashFilePath = path.join(modulePath, '.module-hash');

    if (!(await fs.pathExists(hashFilePath))) {
      return null;
    }

    const hashContent = await fs.readFile(hashFilePath, 'utf-8');
    return hashContent.trim();
  }

  /**
   * 保存模块的哈希值
   * @param modulePath 模块路径
   * @param hash 哈希值
   */
  async saveModuleHash(modulePath: string, hash: string): Promise<void> {
    const hashFilePath = path.join(modulePath, '.module-hash');
    await fs.writeFile(hashFilePath, hash);
  }

  /**
   * 检查模块是否被修改
   * @param modulePath 模块路径
   * @returns 是否被修改
   */
  async isModuleModified(modulePath: string): Promise<boolean> {
    const savedHash = await this.readInstalledModuleHash(modulePath);
    if (!savedHash) {
      return false;
    }

    const currentHash = await this.calculateDirectoryHash(modulePath);
    return savedHash !== currentHash;
  }

  /**
   * 遍历目录
   * @param dirPath 目录路径
   * @param callback 回调函数，对每个文件执行
   */
  private async walkDirectory(
    dirPath: string,
    callback: (filePath: string) => void
  ): Promise<void> {
    const files = await fs.readdir(dirPath);

    for (const file of files.sort()) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .git 目录
        if (file !== 'node_modules' && file !== '.git') {
          await this.walkDirectory(filePath, callback);
        }
      } else if (stat.isFile()) {
        // 跳过 lock 文件和临时文件
        const skipPatterns = ['.lock', '.log', '.DS_Store', 'npm-debug'];
        const shouldSkip = skipPatterns.some((pattern) => file.endsWith(pattern));

        if (!shouldSkip) {
          callback(filePath);
        }
      }
    }
  }
}
