import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * module
 * ValidationmoduleFile
 */
export class moduleHashService {
  /**
   * Directory（AllFile）
   * @param dirPath Directory
   * @returns SHA256
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
   * File
   * @param filePath File
   * @returns SHA256
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * ValidationFile
   * @param filePath File
   * @param expectedHash 
   * @returns YesNo
   */
  async verifyFileHash(filePath: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateFileHash(filePath);
    return actualHash === expectedHash;
  }

  /**
   * module
   * @param modulePath module
   * @returns null
   */
  async readInstalledmoduleHash(modulePath: string): Promise<string | null> {
    const hashFilePath = path.join(modulePath, '.module-hash');

    if (!(await fs.pathExists(hashFilePath))) {
      return null;
    }

    const hashContent = await fs.readFile(hashFilePath, 'utf-8');
    return hashContent.trim();
  }

  /**
   * module
   * @param modulePath module
   * @param hash 
   */
  async savemoduleHash(modulePath: string, hash: string): Promise<void> {
    const hashFilePath = path.join(modulePath, '.module-hash');
    await fs.writeFile(hashFilePath, hash);
  }

  /**
   * moduleYesNo
   * @param modulePath module
   * @returns YesNo
   */
  async ismoduleModified(modulePath: string): Promise<boolean> {
    const savedHash = await this.readInstalledmoduleHash(modulePath);
    if (!savedHash) {
      return false;
    }

    const currentHash = await this.calculateDirectoryHash(modulePath);
    return savedHash !== currentHash;
  }

  /**
   * Directory
   * @param dirPath Directory
   * @param callback ，File
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
        //  node_modules  .git Directory
        if (file !== 'node_modules' && file !== '.git') {
          await this.walkDirectory(filePath, callback);
        }
      } else if (stat.isFile()) {
        //  lock FileFile
        const skipPatterns = ['.lock', '.log', '.DS_Store', 'npm-debug'];
        const shouldSkip = skipPatterns.some((pattern) => file.endsWith(pattern));

        if (!shouldSkip) {
          callback(filePath);
        }
      }
    }
  }
}
