import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Calculate directory hash (SHA256)
 * @param dirPath - Directory path
 * @returns SHA256 hash
 */
export async function calculateDirectoryHash(dirPath: string): Promise<string> {
  const hash = crypto.createHash('sha256');

  const walkDir = async (currentPath: string) => {
    const files = await fs.readdir(currentPath);

    for (const file of files.sort()) {
      const filePath = path.join(currentPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and .git directories
        if (file !== 'node_modules' && file !== '.git') {
          await walkDir(filePath);
        }
      } else if (stat.isFile()) {
        // Skip lock files and log files
        if (!file.endsWith('.lock') && !file.endsWith('.log')) {
          const content = await fs.readFile(filePath);
          hash.update(content);
        }
      }
    }
  };

  await walkDir(dirPath);
  return hash.digest('hex');
}

/**
 * Format bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Walk directory and collect all files matching pattern
 * @param dir - Directory to walk
 * @param filter - Filter function for files
 * @returns Array of file paths
 */
export async function walkDirectory(
  dir: string,
  filter?: (filePath: string, stat: fs.Stats) => boolean
): Promise<string[]> {
  const files: string[] = [];

  const walkDir = async (currentPath: string) => {
    const entries = await fs.readdir(currentPath);

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        await walkDir(entryPath);
      } else if (!filter || filter(entryPath, stat)) {
        files.push(entryPath);
      }
    }
  };

  await walkDir(dir);
  return files;
}
