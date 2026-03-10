import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';
import * as crypto from 'crypto';
import FormData = require('form-data');
import { ApiService } from './api.service';
import { PackageJson, moduleInfo, VersionInfo, Stats, ApiResponse } from '../types';

/**
 * module
 * module、Version
 */
export class moduleService {
  constructor(private api: ApiService) {}

  /**
   * Directory(AllFile)
   * @param dirPath - Directory
   * @returns SHA256
   */
  private async calculateDirectoryHash(dirPath: string): Promise<string> {
    const hash = crypto.createHash('sha256');

    const walkDir = async (currentPath: string) => {
      const files = await fs.readdir(currentPath);

      for (const file of files.sort()) {
        const filePath = path.join(currentPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          //  node_modules  .git Directory
          if (file !== 'node_modules' && file !== '.git') {
            await walkDir(filePath);
          }
        } else if (stat.isFile()) {
          //  lock FileFile
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
   * module
   */
  private async readInstalledmoduleHash(_modulePath: string): Promise<string | null> {
    return null;
  }

  /**
   * module
   * @param modulePath - module
   * @param hash - 
   */
  private async savemoduleHash(modulePath: string, hash: string): Promise<void> {
    const hashFilePath = path.join(modulePath, '.module-hash');
    await fs.writeFile(hashFilePath, hash);
  }

  /**
   * moduleYesNo
   * @param moduleName module name
   * @param targetVersion Version
   * @param installDir Directory（ projectRoot）
   * @param projectRoot Directory
   * @returns { isInstalled: boolean, needsUpdate: boolean, installedVersion: string | null, installedName: string | null }
   */
  async checkmoduleStatus(
    moduleName: string,
    targetVersion: string,
    installDir = 'node_modules',
    projectRoot?: string
  ): Promise<{
    isInstalled: boolean;
    needsUpdate: boolean;
    installedVersion: string | null;
    installedName: string | null;
  }> {
    //  projectRoot， projectRoot 
    const basePath = projectRoot || process.env.INIT_CWD || process.cwd();
    const modulePath = path.resolve(basePath, installDir, moduleName);

    // DirectoryYesNo
    const isInstalled = await fs.pathExists(modulePath);

    if (!isInstalled) {
      return {
        isInstalled: false,
        needsUpdate: false,
        installedVersion: null,
        installedName: null,
      };
    }

    // module module.config.json
    const moduleConfigPath = path.join(modulePath, 'module.config.json');
    if (!(await fs.pathExists(moduleConfigPath))) {
      return { isInstalled: true, needsUpdate: true, installedVersion: null, installedName: null };
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedVersion = moduleConfig.version || null;
    const installedName = moduleConfig.name || null;

    // Version，
    if (installedVersion !== targetVersion) {
      return { isInstalled: true, needsUpdate: true, installedVersion, installedName };
    }

    // Version，(，)
    return { isInstalled: true, needsUpdate: false, installedVersion, installedName };
  }

  async upload(moduleDir: string): Promise<void> {
    // Directory（npm/yarn  INIT_CWD  cwd）
    const initialCwd = process.env.INIT_CWD || process.cwd();

    // （Directory）
    const absolutemoduleDir = path.resolve(initialCwd, moduleDir);

    //  package.json
    const packageJsonPath = path.join(absolutemoduleDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Error: 未找到 package.json File: ${packageJsonPath}`);
    }

    const packageJson: PackageJson = fs.readJsonSync(packageJsonPath);

    //  module.config.json
    const moduleConfigPath = path.join(absolutemoduleDir, 'module.config.json');
    let appId = '';
    let teamId = '';
    let type = '';
    if (fs.existsSync(moduleConfigPath)) {
      const moduleConfig = fs.readJsonSync(moduleConfigPath);
      appId = moduleConfig.appId || '';
      teamId = moduleConfig.teamId || '';
      type = moduleConfig.type || '';
    }

    const moduleName = packageJson.name;
    const moduleVersion = packageJson.version;
    const moduleDescription = packageJson.description || '';

    if (!moduleName || !moduleVersion) {
      throw new Error('Error: package.json 中缺少必需的 name 或 version 字段');
    }

    console.log(`正在打包module ${moduleName}@${moduleVersion}...`);
    console.log(`名称: ${moduleName}`);
    console.log(`Version: ${moduleVersion}`);
    console.log(`Description: ${moduleDescription}`);
    if (type) {
      console.log(`Type: ${type}`);
    }
    if (appId) {
      console.log(`应用ID: ${appId}`);
    }
    if (teamId) {
      console.log(`团队ID: ${teamId}`);
    }
    console.log('注意: AuthorInfo将从您的login账号自动获取');

    //  tgz File（UserDirectory .module-temp）
    const tempDir = path.join(require('os').homedir(), '.module-temp');
    fs.ensureDirSync(tempDir);
    const tgzPath = path.join(tempDir, `${moduleName}-${moduleVersion}.tgz`);

    console.log(`module directory: ${absolutemoduleDir}`);
    console.log(`临时File: ${tgzPath}`);

    //  .npmignore ， external_modules/ Directory
    await this.ensureNpmignore(absolutemoduleDir);

    await this.createPackage(absolutemoduleDir, tgzPath);

    console.log('上传中...');

    // （ author ）
    const formData = new FormData();
    formData.append('package', fs.createReadStream(tgzPath));
    formData.append('name', moduleName);
    formData.append('version', moduleVersion);
    formData.append('description', moduleDescription);
    if (appId) {
      formData.append('appId', appId); //  appId
    }
    if (teamId) {
      formData.append('teamId', teamId); //  teamId
    }
    if (type) {
      formData.append('type', type); //  type
    }

    const response = await this.api.post<ApiResponse<{ module: moduleInfo }>>(
      '/api/modules/upload',
      formData,
      true
    );

    if (response.success && response.module) {
      console.log(`✓ module ${moduleName}@${moduleVersion} 上传Success!`);
      if (response.module.author) {
        console.log(`  Author: ${response.module.author}`);
      }
    } else {
      throw new Error(response.message || '上传Failed');
    }

    // File
    fs.removeSync(tempDir);
  }

  async install(moduleName: string, version?: string, installDir = 'node_modules'): Promise<void> {
    // Directory（npm/yarn  INIT_CWD  cwd）
    const initialCwd = process.env.INIT_CWD || process.cwd();

    let targetVersion = version;
    const installPath = path.resolve(initialCwd, installDir, moduleName);

    // Version，Version
    if (!targetVersion) {
      console.log(`获取 ${moduleName} 的最新Version...`);
      const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
        `/api/modules/${moduleName}`
      );

      if (!response.success || !response.module) {
        throw new Error(response.message || '获取moduleInfoFailed');
      }

      targetVersion = response.module.latest;
    }

    //  targetVersion 
    if (!targetVersion) {
      throw new Error('无法确定module version');
    }

    // moduleStatus
    const moduleStatus = await this.checkmoduleStatus(
      moduleName,
      targetVersion,
      installDir,
      initialCwd
    );

    if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
      console.log(
        `🔄 ${moduleName} 需要重新安装${moduleStatus.installedVersion ? ` (Current: ${moduleStatus.installedVersion})` : ''}...`
      );
    }

    console.log(`下载 ${moduleName}@${targetVersion}...`);

    const downloadUrl = `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`;

    const axios = (await import('axios')).default;
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: this.api['getAuthHeaders']?.() || {},
    });

    const tempDir = path.join(require('os').homedir(), '.module-temp');
    fs.ensureDirSync(tempDir);
    const tgzPath = path.join(tempDir, `${moduleName}-${targetVersion}.tgz`);
    const writer = fs.createWriteStream(tgzPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    console.log('解压中...');

    await this.extractTgz(tgzPath, installPath);
    fs.unlinkSync(tgzPath);

    console.log(`✓ module ${moduleName}@${targetVersion} Installation successful!`);

    // （，All）
    const moduleHash = await this.calculateDirectoryHash(installPath);
    await this.savemoduleHash(installPath, moduleHash);

    // Dependencies
    await this.installDependencies(moduleName, installPath, initialCwd);

    //  module.config.json Recordmodule
    await this.installConfiguredmodules(installPath, initialCwd);
  }

  /**
   * module
   * moduleDirectorymodule，
   * @param parentmodulePath module
   * @param actualmodulePath module（）
   * @param _linkmodulePath （）
   * @param projectRoot Directory
   * @param _moduleName module name（， actualmodulePath ）
   */
  private async fixmoduleImportsFormodule(
    parentmodulePath: string,
    actualmodulePath: string,
    _linkmodulePath: string,
    _projectRoot: string,
    _moduleName?: string
  ): Promise<void> {
    const parentSrcPath = path.join(parentmodulePath, 'src');
    if (!(await fs.pathExists(parentSrcPath))) {
      return;
    }

    // module name
    const moduleName = path.basename(actualmodulePath);

    // All .ts File
    const tsFiles: string[] = [];
    const walkDir = async (dir: string) => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await walkDir(filePath);
        } else if (file.endsWith('.ts')) {
          tsFiles.push(filePath);
        }
      }
    };

    await walkDir(parentSrcPath);

    console.log(`      [导入路径] 检查 ${tsFiles.length} 个File中的 ${moduleName} 引用...`);

    for (const filePath of tsFiles) {
      let content = await fs.readFile(filePath, 'utf-8');
      let modified = false;

      //  './external_modules/{moduleName}/...' 
      const importRegex = new RegExp(
        `import\\s+.*?\\s+from\\s+['"]((?:\\.\\.?\\/)*external_modules\\/${moduleName}[^'"]*)['"]`,
        'g'
      );
      let match: RegExpExecArray | null;

      while ((match = importRegex.exec(content)) !== null) {
        const fullImportPath = match[1];
        if (!fullImportPath) continue;

        const importStatement = match[0];

        // ，（ 'src'  'src/...'）
        const pathMatch = fullImportPath.match(
          new RegExp(`external_modules\\/${moduleName}\\/([^'"]*)`)
        );
        if (!pathMatch) continue;

        const sourcePath = pathMatch[1] || 'src'; // Default 'src'

        // CurrentFilemodule
        const targetRealPath = path.join(actualmodulePath, sourcePath);

        //  index ，module index.ts
        const relativePath = path.relative(path.dirname(filePath), targetRealPath);
        const normalizedPath = relativePath.replace(/\\/g, '/');

        // 
        const newImportStatement = importStatement.replace(/['"][^'"]+['"]/, `'${normalizedPath}'`);

        content = content.replace(importStatement, newImportStatement);
        modified = true;

        console.log(`        修正: ${fullImportPath} -> ${normalizedPath}`);
      }

      if (modified) {
        await fs.writeFile(filePath, content, 'utf-8');
      }
    }
  }

  /**
   * moduleAllDependencies
   * @param modulePath module
   * @param projectRoot Directory
   */
  async fixImportFormodule(modulePath: string, projectRoot: string): Promise<void> {
    const moduleConfigPath = path.join(modulePath, 'module.config.json');
    const moduleName = path.basename(modulePath);

    if (!(await fs.pathExists(moduleConfigPath))) {
      console.log(`⚠️  module ${moduleName} 没有 module.config.json，跳过`);
      return;
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedmodules = moduleConfig.installedmodules;

    if (!installedmodules || Object.keys(installedmodules).length === 0) {
      console.log(`✓ module ${moduleName} 没有配置Dependencies，无需修正`);
      return;
    }

    console.log(`module ${moduleName} 配置的Dependencies: ${Object.keys(installedmodules).join(', ')}\n`);

    for (const [depName, depVersion] of Object.entries(installedmodules)) {
      const version = String(depVersion);

      console.log(`  处理Dependencies ${depName}@${version}...`);

      // YesNoDirectorymodule
      const existingmodulePath = await this.findExistingmoduleInAncestors(
        depName,
        version,
        modulePath,
        projectRoot
      );

      if (existingmodulePath) {
        console.log(`    ✓ 在父级Directory找到 ${depName}@${version}`);
        console.log(`    📝 修正导入路径指向: ${path.relative(projectRoot, existingmodulePath)}`);

        // 
        const depInstallPath = path.join(modulePath, 'external_modules', depName);
        await this.fixmoduleImportsFormodule(
          modulePath,
          existingmodulePath,
          depInstallPath,
          projectRoot,
          depName
        );
      } else {
        console.log(`    ⚠️  未在父级Directory找到 ${depName}@${version}，跳过`);
      }
    }
  }

  async list(): Promise<void> {
    const response = await this.api.get<ApiResponse<{ modules: moduleInfo[] }>>('/api/modules');

    if (!response.success || !response.modules) {
      throw new Error(response.message || '获取moduleListFailed');
    }

    const modules = response.modules;

    if (modules.length === 0) {
      console.log('暂无module');
      return;
    }

    console.log('\nmoduleList:');
    console.log('─'.repeat(80));
    modules.forEach((mod: moduleInfo) => {
      const typeLabel = mod.type ? ` [${mod.type}]` : '';
      console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
      console.log(`  Description: ${mod.description || '无'}`);
      console.log(`  Author: ${mod.author}${mod.uploadedBy ? ` (${mod.uploadedBy})` : ''}`);
      console.log(`  Version数: ${Object.keys(mod.versions).length}`);
      console.log('─'.repeat(80));
    });
  }

  async search(query: string): Promise<void> {
    const response = await this.api.get<ApiResponse<{ modules: moduleInfo[] }>>(
      `/api/modules?q=${encodeURIComponent(query)}`
    );

    if (!response.success || !response.modules) {
      throw new Error(response.message || '搜索Failed');
    }

    const modules = response.modules;

    if (modules.length === 0) {
      console.log('未找到匹配的module');
      return;
    }

    console.log(`\n搜索 "${query}" 的结果:`);
    console.log('─'.repeat(80));
    modules.forEach((mod: moduleInfo) => {
      const typeLabel = mod.type ? ` [${mod.type}]` : '';
      console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
      console.log(`  Description: ${mod.description || '无'}`);
      console.log(`  Author: ${mod.author}`);
      console.log('─'.repeat(80));
    });
  }

  async info(moduleName: string): Promise<void> {
    const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
      `/api/modules/${moduleName}`
    );

    if (!response.success || !response.module) {
      throw new Error(response.message || '获取moduleInfoFailed');
    }

    const module = response.module;

    console.log(`\nmoduleInfo:`);
    console.log('─'.repeat(40));
    console.log(`名称: ${module.name}`);
    console.log(`Description: ${module.description || '无'}`);
    console.log(`Type: ${module.type || '未Category'}`);
    console.log(`Author: ${module.author}${module.uploadedBy ? ` (${module.uploadedBy})` : ''}`);
    console.log(`创建时间: ${module.createdAt}`);
    console.log(`最新Version: ${module.latest}`);
    if (module.appId) {
      console.log(`应用ID: ${module.appId}`);
    }
    if (module.teamId) {
      console.log(`团队ID: ${module.teamId}`);
    }
    console.log(`\nAllVersion:`);
    Object.keys(module.versions).forEach((version: string) => {
      const v = module.versions as Record<string, VersionInfo>;
      const versionInfo = v[version];
      if (versionInfo) {
        console.log(
          `  ${version} - ${this.formatSize(versionInfo.size)} (${versionInfo.uploadedAt})`
        );
      }
    });
  }

  async getStats(): Promise<void> {
    const response = await this.api.get<ApiResponse<{ stats: Stats }>>('/api/stats');

    if (!response.success || !response.stats) {
      throw new Error(response.message || '获取统计InfoFailed');
    }

    const stats = response.stats;
    console.log('\n注册中心统计:');
    console.log('─'.repeat(40));
    console.log(`module总数: ${stats.totalmodules}`);
    console.log(`Version总数: ${stats.totalVersions}`);
    console.log(`总大小: ${this.formatSize(stats.totalSize)}`);

    if (stats.topAuthors && stats.topAuthors.length > 0) {
      console.log('\n最活跃Author:');
      stats.topAuthors.forEach((item: { author: string; count: number }) => {
        console.log(`  ${item.author}: ${item.count} 个module`);
      });
    }
  }

  private createPackage(moduleDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      //  npm pack  .tgz 
      child_process.exec('npm pack', { cwd: moduleDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`打包Failed: ${stderr}`));
          return;
        }

        // npm pack YesFile
        const generatedFileName = stdout.trim();

        if (!generatedFileName) {
          reject(new Error('npm pack 未返回File名'));
          return;
        }

        const tgzPath = path.join(moduleDir, generatedFileName);

        // FileYesNo
        if (!fs.existsSync(tgzPath)) {
          reject(new Error(`打包Filedoes not exist: ${tgzPath}`));
          return;
        }

        //  .tgz File
        fs.moveSync(tgzPath, outputPath, { overwrite: true });
        resolve();
      });
    });
  }

  private extractTgz(tgzPath: string, extractDir: string): Promise<void> {
    const tar = require('tar');
    // tarball  package Directory
    return new Promise((resolve, reject) => {
      fs.ensureDirSync(extractDir);
      tar
        .x({
          file: tgzPath,
          cwd: extractDir,
          strip: 1, //  package Directory
        })
        .then(() => {
          //  tarball File（npm pack ）
          const tarballFiles = fs.readdirSync(extractDir).filter((f) => f.endsWith('.tgz'));
          tarballFiles.forEach((f) => fs.removeSync(path.join(extractDir, f)));
          resolve();
        })
        .catch(reject);
    });
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   *  .npmignore File，Directory
   * @param moduleDir module directory
   */
  private async ensureNpmignore(moduleDir: string): Promise<void> {
    const npmignorePath = path.join(moduleDir, '.npmignore');

    if (!fs.existsSync(npmignorePath)) {
      const defaultIgnore = [
        '# External modules (不打包，通过 modules.json 运行时安装）',
        'external_modules',
        '',
        '# Node modules',
        'node_modules/',
        '',
        '# Build outputs',
        'dist/',
        'build/',
        '',
        '# Git files',
        '.git/',
        '.gitignore',
        '',
        '# Logs',
        '*.log',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '',
        '# System files',
        '.DS_Store',
        'Thumbs.db',
        '',
        '# Test coverage',
        'coverage/',
        '',
        '# IDE files',
        '.vscode/',
        '.idea/',
        '*.swp',
        '*.swo',
        '*~',
      ];

      fs.writeFileSync(npmignorePath, defaultIgnore.join('\n'));
      console.log('  ✓ 创建 .npmignore File（排除 external_modules，保留 local_modules）');
    } else {
      //  .npmignore 
      const npmignoreContent = fs.readFileSync(npmignorePath, 'utf-8');
      const lines = npmignoreContent.split('\n');
      let updated = false;

      //  external_modules 
      if (
        !lines.some(
          (line) => line.trim() === 'external_modules' || line.trim() === '/external_modules'
        )
      ) {
        lines.unshift(
          '# External modules (不打包，通过 modules.json 运行时安装）',
          'external_modules',
          ''
        );
        updated = true;
      }

      //  local_modules （local_modules ）
      const updatedLines = lines.filter((line) => {
        const trimmed = line.trim();
        return !(
          trimmed === 'local_modules' ||
          trimmed === '/local_modules' ||
          trimmed === 'local_modules/' ||
          trimmed === '/local_modules/'
        );
      });

      if (updated || updatedLines.length !== lines.length) {
        fs.writeFileSync(npmignorePath, updatedLines.join('\n'));
        console.log('  ✓ 更新 .npmignore File（排除 external_modules，保留 local_modules）');
      }
    }
  }

  /**
   * moduleDependencies
   * @param moduleName module name
   * @param modulePath module
   * @param projectRoot Directory
   */
  private async installDependencies(
    moduleName: string,
    modulePath: string,
    projectRoot: string
  ): Promise<void> {
    // module package.json
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`  [Dependencies] module ${moduleName} 没有 package.json，跳过Dependencies安装`);
      return;
    }

    const packageJson = fs.readJsonSync(packageJsonPath);
    const dependencies = packageJson.dependencies || {};
    const localmodules = packageJson.localmodules || {};

    if (Object.keys(dependencies).length === 0) {
      console.log(`  [Dependencies] module ${moduleName} 无 package.json Dependencies`);
    }

    console.log(`\n  [Dependencies] Start解析module ${moduleName} 的Dependencies...`);

    // CategoryDependencies（ npm ， @module-registry/ Dependencies）
    const npmDependencies: Array<{ name: string; version: string }> = [];

    for (const [depName, depVersion] of Object.entries(dependencies)) {
      if (depName === '@module-registry/custom-service-core') {
        //  - （）
        console.log(`    - 跳过框架核心: ${depName} (项目已包含)`);
      } else if (depName.startsWith('@module-registry/')) {
        // @module-registry/ Dependencies， modules.json 
        console.log(
          `    - moduleDependencies（由 modules.json 管理）: ${depName}${depVersion ? '@' + depVersion : ''}`
        );
      } else {
        //  npm  -  npm/yarn 
        npmDependencies.push({ name: depName, version: depVersion as string });
        console.log(`    - npm Dependencies: ${depName}${depVersion ? '@' + depVersion : ''}`);
      }
    }

    //  package.json LocalmoduleDependencies（local_modules）
    if (localmodules && Object.keys(localmodules).length > 0) {
      console.log(`\n  [package.json] 发现module ${moduleName} 的Local微服务Dependencies (local_modules)...`);

      // DependenciesDirectory：Currentmodule src/local_modules/ 
      //  external_modules ， src Directory
      const localmodulesPath = path.join(modulePath, 'src', 'local_modules');

      for (const [depName, depVersion] of Object.entries(localmodules)) {
        const version = String(depVersion);
        console.log(`    - local_modules Dependencies: ${depName}@${version}`);

        // Dependenciesmodule src/local_modules/ 
        const depInstallPath = path.join(localmodulesPath, depName);
        console.log(
          `[DEBUG] checking if ${depInstallPath} exists: ${fs.existsSync(depInstallPath)}`
        );

        if (!fs.existsSync(depInstallPath)) {
          console.log(`    安装 local_modules Dependencies: ${depName} 到 ${localmodulesPath}...`);

          // DirectoryYesNomodule
          const existingmodulePath = await this.findExistingmoduleInAncestors(
            depName,
            version,
            modulePath,
            projectRoot
          );

          if (existingmodulePath) {
            // Directorymodule，
            console.log(
              `    🔗 在父级Directory中找到 ${depName}@${version}，直接修正导入路径指向 ${existingmodulePath}`
            );

            // ，/
            await this.createSymlinkOrCopy(
              existingmodulePath,
              depInstallPath,
              modulePath,
              depName,
              projectRoot
            );

            // Dependencies
            await this.installDependencies(depName, existingmodulePath, projectRoot);
          } else {
            // ，
            console.log(`    未在父级Directory中找到 ${depName}，Start下载安装...`);

            // （module modules.json， local_modules  external_modules）
            const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');

            // Version
            let targetVersion = version;
            if (version.startsWith('^') || version.startsWith('~')) {
              // moduleInfoVersion
              const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
                `/api/modules/${depName}`
              );
              if (response.success && response.module) {
                // Version：Version
                targetVersion = response.module.latest;
              }
            }

            // module src/local_modules/ Directory
            //  projectRoot 
            const installDir = path.relative(projectRoot, relativeInstallDir);
            await this.install(depName, targetVersion, installDir);
          }
        } else {
          console.log(`    local_modules Dependencies ${depName} 已安装，检查Dependencies...`);
          // module，Dependencies
          await this.installDependencies(depName, depInstallPath, projectRoot);
        }
      }
    }

    //  modules.json LocalmoduleDependencies（local_modules）
    const modulesJsonPath = path.join(modulePath, 'modules.json');
    console.log(
      `[DEBUG] modulesJsonPath: ${modulesJsonPath}, exists: ${fs.existsSync(modulesJsonPath)}`
    );
    if (fs.existsSync(modulesJsonPath)) {
      try {
        const modulesConfig = fs.readJsonSync(modulesJsonPath);
        console.log(`[DEBUG] modulesConfig: ${JSON.stringify(modulesConfig)}`);

        if (modulesConfig.localmodules && Object.keys(modulesConfig.localmodules).length > 0) {
          console.log(
            `\n  [modules.json] 发现module ${moduleName} 的Local微服务Dependencies (local_modules)...`
          );

          // DependenciesDirectory：Currentmodule src/local_modules/ 
          //  external_modules ， src Directory
          const localmodulesPath = path.join(modulePath, 'src', 'local_modules');

          for (const [depName, depVersion] of Object.entries(modulesConfig.localmodules)) {
            const version = String(depVersion);
            console.log(`    - local_modules Dependencies: ${depName}@${version}`);

            // Dependenciesmodule src/local_modules/ 
            const depInstallPath = path.join(localmodulesPath, depName);

            if (!fs.existsSync(depInstallPath)) {
              console.log(`    安装 local_modules Dependencies: ${depName} 到 ${localmodulesPath}...`);

              // DirectoryYesNomodule
              const existingmodulePath = await this.findExistingmoduleInAncestors(
                depName,
                version,
                modulePath,
                projectRoot
              );

              if (existingmodulePath) {
                // Directorymodule，
                console.log(
                  `    🔗 在父级Directory中找到 ${depName}@${version}，创建软链接指向 ${existingmodulePath}`
                );

                const linkPath = depInstallPath;

                // ，
                if (await fs.pathExists(linkPath)) {
                  await fs.remove(linkPath);
                }

                // 
                await fs.ensureSymlink(existingmodulePath, linkPath);
                console.log(`    ✓ 软链接创建Success: ${linkPath} -> ${existingmodulePath}`);

                // Dependencies
                await this.installDependencies(depName, linkPath, projectRoot);
              } else {
                // ，
                console.log(`    未在父级Directory中找到 ${depName}，Start下载安装...`);

                // （module modules.json， local_modules  external_modules）
                const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');

                // Version
                let targetVersion = version;
                if (version.startsWith('^') || version.startsWith('~')) {
                  // moduleInfoVersion
                  const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
                    `/api/modules/${depName}`
                  );
                  if (response.success && response.module) {
                    // Version：Version
                    targetVersion = response.module.latest;
                  }
                }

                // module src/local_modules/ Directory
                //  projectRoot 
                const installDir = path.relative(projectRoot, relativeInstallDir);
                await this.install(depName, targetVersion, installDir);
              }
            } else {
              console.log(`    local_modules Dependencies ${depName} 已安装，检查Dependencies...`);
              // module，Dependencies（ externalmodules  localmodules）
              await this.installDependencies(depName, depInstallPath, projectRoot);
            }
          }
        }

        //  modules.json moduleDependencies（）
        if (
          modulesConfig.externalmodules &&
          Object.keys(modulesConfig.externalmodules).length > 0
        ) {
          console.log(
            `\n  [modules.json] 发现module ${moduleName} 的外部微服务Dependencies (external_modules)...`
          );

          // DependenciesDirectory：Currentmodule src/external_modules/ 
          //  modulePath Yes projectRoot/src/external_modules/user
          // Dependencies projectRoot/src/external_modules/user/src/external_modules/
          const parentExternalmodulesPath = path.join(modulePath, 'src', 'external_modules');

          for (const [depName, depVersion] of Object.entries(modulesConfig.externalmodules)) {
            const version = String(depVersion);
            console.log(`    - external_modules Dependencies: ${depName}@${version}`);

            // Dependenciesmodule src/external_modules/ 
            const depInstallPath = path.join(parentExternalmodulesPath, depName);

            if (!fs.existsSync(depInstallPath)) {
              console.log(
                `    安装 external_modules Dependencies: ${depName} 到 ${parentExternalmodulesPath}...`
              );

              // DirectoryYesNomodule
              const existingmodulePath = await this.findExistingmoduleInAncestors(
                depName,
                version,
                modulePath,
                projectRoot
              );

              if (existingmodulePath) {
                // Directorymodule，
                console.log(
                  `    🔗 在父级Directory中找到 ${depName}@${version}，创建软链接指向 ${existingmodulePath}`
                );

                const linkPath = depInstallPath;

                // ，
                if (await fs.pathExists(linkPath)) {
                  await fs.remove(linkPath);
                }

                // 
                await fs.ensureSymlink(existingmodulePath, linkPath);
                console.log(`    ✓ 软链接创建Success: ${linkPath} -> ${existingmodulePath}`);

                // Dependencies
                await this.installDependencies(depName, linkPath, projectRoot);
              } else {
                // ，
                console.log(`    未在父级Directory中找到 ${depName}，Start下载安装...`);

                // （module modules.json）
                // ：src/external_modules -> module directory
                const relativeInstallDir = path.join(modulePath, 'src', 'external_modules');

                // Version
                let targetVersion = version;
                if (version.startsWith('^') || version.startsWith('~')) {
                  // moduleInfoVersion
                  const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
                    `/api/modules/${depName}`
                  );
                  if (response.success && response.module) {
                    // Version：Version
                    targetVersion = response.module.latest;
                  }
                }

                // module src/external_modules/ Directory
                //  projectRoot 
                const installDir = path.relative(projectRoot, relativeInstallDir);
                await this.install(depName, targetVersion, installDir);
              }
            } else {
              console.log(`    external_modules Dependencies ${depName} 已安装，检查Dependencies...`);
              // module，Dependencies（ externalmodules  localmodules）
              await this.installDependencies(depName, depInstallPath, projectRoot);
            }
          }
        }
      } catch (error: unknown) {
        console.error(
          `  [modules.json] 解析 ${moduleName} 的 modules.json Failed:`,
          error instanceof Error ? error.message : String(error)
        );
        // Error，
      }
    }

    //  npm Dependencies
    if (npmDependencies.length > 0) {
      console.log(`\n  [Dependencies] 安装 npm Dependencies...`);
      await this.installNpmDependencies(npmDependencies, projectRoot);
    }

    console.log(`\n  [Dependencies] module ${moduleName} 的Dependencies安装Complete`);
  }

  /**
   *  module.config.json Recordmodule
   * @param modulePath module
   * @param projectRoot Directory
   */
  private async installConfiguredmodules(modulePath: string, projectRoot: string): Promise<void> {
    const moduleConfigPath = path.join(modulePath, 'module.config.json');

    if (!(await fs.pathExists(moduleConfigPath))) {
      return;
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedmodules = moduleConfig.installedmodules;

    if (!installedmodules || Object.keys(installedmodules).length === 0) {
      return;
    }

    const moduleName = path.basename(modulePath);
    console.log(
      `\n  [module.config.json] ${moduleName} 配置的module: ${Object.keys(installedmodules).join(', ')}`
    );

    for (const [modName, modVersion] of Object.entries(installedmodules)) {
      const version = String(modVersion);
      console.log(`    - ${modName}@${version}`);

      try {
        // moduleCurrentmodule external_modules Directory
        // ：s3  s2/src/external_modules/s3
        //       s4  s2/src/external_modules/s3/external_modules
        const submoduleInstallDir = path.join(modulePath, 'external_modules');

        // Directory
        const relativeInstallDir = path.relative(projectRoot, submoduleInstallDir);

        // YesNoDirectorymodule
        // ：Directory，LocalYesNo
        // LocalYes
        console.log(`      🔍 在父级Directory搜索 ${modName}@${version}...`);
        const existingmodulePath = await this.findExistingmoduleInAncestors(
          modName,
          version,
          modulePath,
          projectRoot
        );

        const depInstallPath = path.join(projectRoot, relativeInstallDir, modName);

        if (existingmodulePath) {
          // Directorymodule
          console.log(`      🔗 在父级Directory找到 ${modName}@${version}，直接修正导入路径`);

          // ，/
          await this.createSymlinkOrCopy(
            existingmodulePath,
            depInstallPath,
            modulePath,
            modName,
            projectRoot
          );

          // module
          await this.installConfiguredmodules(existingmodulePath, projectRoot);
        } else {
          // moduleYesNo
          const moduleStatus = await this.checkmoduleStatus(
            modName,
            version,
            relativeInstallDir,
            projectRoot
          );

          if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
            console.log(`      ⏭️  ${modName}@${version} 已安装且未修改（跳过下载）`);
            // ，module
            await this.installConfiguredmodules(depInstallPath, projectRoot);
          } else {
            // module
            if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
              console.log(`      🔄 ${modName} 需要重新安装...`);
            } else {
              console.log(`      ⬇️  下载并安装 ${modName}@${version}...`);
            }

            await this.install(modName, version, relativeInstallDir);

            // 
            console.log(`      🔧 修正 ${moduleName} 中 ${modName} 的导入路径...`);
            await this.fixmoduleImportsFormodule(
              modulePath,
              depInstallPath,
              depInstallPath,
              projectRoot
            );
          }
        }
      } catch (error: unknown) {
        console.error(
          `      ❌ 安装 ${modName} Failed:`,
          error instanceof Error ? error.message : String(error)
        );
        // Othermodule
      }
    }
  }

  /**
   * Directorymodule
   * @param moduleName module name
   * @param targetVersion Version
   * @param currentmodulePath Currentmodule
   * @param projectRoot Directory
   * @returns module， null
   */
  private async findExistingmoduleInAncestors(
    moduleName: string,
    targetVersion: string,
    currentmodulePath: string,
    projectRoot: string
  ): Promise<string | null> {
    console.log(`[findExistingmoduleInAncestors] Start搜索 ${moduleName}@${targetVersion}`);
    console.log(`[findExistingmoduleInAncestors] currentmodulePath: ${currentmodulePath}`);
    console.log(`[findExistingmoduleInAncestors] projectRoot: ${projectRoot}`);

    // Directory src/external_modules
    const projectExternalmodulesPath = path.join(projectRoot, 'src', 'external_modules');
    console.log(`[findExistingmoduleInAncestors] 优先检查: ${projectExternalmodulesPath}`);

    const projectmodulePath = path.join(projectExternalmodulesPath, moduleName);
    if (await fs.pathExists(projectmodulePath)) {
      const relativePath = 'src/external_modules';
      console.log(`[findExistingmoduleInAncestors] module存在于项目根Directory`);
      const moduleStatus = await this.checkmoduleStatus(
        moduleName,
        targetVersion,
        relativePath,
        projectRoot
      );

      if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
        console.log(`      ✓ 在项目根Directory ${relativePath} 找到 ${moduleName}@${targetVersion}`);
        return projectmodulePath;
      } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
        console.log(`      ⚠️  在项目根Directory找到 ${moduleName}，但需要更新`);
      }
    }

    // CurrentmoduleStart，All external_modules Directory
    let searchPath = path.normalize(path.dirname(currentmodulePath));
    const normalizedProjectRoot = path.normalize(projectRoot);

    console.log(`[findExistingmoduleInAncestors] Start向上遍历, 初始路径: ${searchPath}`);

    // Directory
    while (searchPath.startsWith(normalizedProjectRoot)) {
      console.log(`[findExistingmoduleInAncestors] 检查路径: ${searchPath}`);

      // CurrentDirectoryYes external_modules，
      if (searchPath.endsWith('external_modules')) {
        const modulePath = path.join(searchPath, moduleName);
        console.log(`[findExistingmoduleInAncestors] 检查module: ${modulePath}`);

        if (await fs.pathExists(modulePath)) {
          // moduleVersionStatus
          const relativePath = path.relative(projectRoot, searchPath);
          console.log(`[findExistingmoduleInAncestors] module存在, relativePath: ${relativePath}`);
          const moduleStatus = await this.checkmoduleStatus(
            moduleName,
            targetVersion,
            relativePath,
            projectRoot
          );

          if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
            console.log(
              `      ✓ 在 ${relativePath} 找到 ${moduleName}@${targetVersion}，已安装且未修改`
            );
            // module
            return path.join(projectRoot, relativePath, moduleName);
          } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
            console.log(
              `      ⚠️  在 ${relativePath} 找到 ${moduleName}，但代码已修改或Version不匹配`
            );
          }
        }
      } else {
        // CurrentDirectoryYes external_modules，YesNo external_modules Directory
        const externalmodulesPath = path.join(searchPath, 'external_modules');
        console.log(`[findExistingmoduleInAncestors] 检查子Directory: ${externalmodulesPath}`);

        if (await fs.pathExists(externalmodulesPath)) {
          const modulePath = path.join(externalmodulesPath, moduleName);
          console.log(`[findExistingmoduleInAncestors] 检查module: ${modulePath}`);

          if (await fs.pathExists(modulePath)) {
            // moduleVersionStatus
            const relativePath = path.relative(projectRoot, externalmodulesPath);
            console.log(`[findExistingmoduleInAncestors] module存在, relativePath: ${relativePath}`);
            const moduleStatus = await this.checkmoduleStatus(
              moduleName,
              targetVersion,
              relativePath,
              projectRoot
            );

            if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
              console.log(
                `      ✓ 在 ${relativePath} 找到 ${moduleName}@${targetVersion}，已安装且未修改`
              );
              // module
              return path.join(projectRoot, relativePath, moduleName);
            } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
              console.log(
                `      ⚠️  在 ${relativePath} 找到 ${moduleName}，但代码已修改或Version不匹配`
              );
            }
          }
        }
      }

      // Directory，
      if (searchPath === normalizedProjectRoot) {
        break;
      }

      // Directory
      searchPath = path.dirname(searchPath);
    }

    console.log(`      ℹ️  未在父级Directory找到 ${moduleName}@${targetVersion}`);
    return null;
  }

  /**
   * （/）
   *  Windows ，Failed（EPERM ）
   * Yesmodule
   * @param sourcePath module
   * @param targetPath （，Interface）
   * @param parentmodulePath module
   * @param moduleName module name
   * @param projectRoot Directory
   */
  private async createSymlinkOrCopy(
    sourcePath: string,
    targetPath: string,
    parentmodulePath: string,
    moduleName: string,
    projectRoot: string
  ): Promise<void> {
    // Windows Failed，
    console.log(`    📝 直接修正导入路径指向: ${path.relative(projectRoot, sourcePath)}`);
    await this.fixmoduleImportsFormodule(
      parentmodulePath,
      sourcePath,
      targetPath,
      projectRoot,
      moduleName
    );
  }

  /**
   *  npm Dependencies
   * @param dependencies npm DependenciesList
   * @param projectRoot Directory
   */
  private async installNpmDependencies(
    dependencies: Array<{ name: string; version: string }>,
    projectRoot: string
  ): Promise<void> {
    //  npm Yes yarn
    const useYarn = fs.existsSync(path.join(projectRoot, 'yarn.lock'));
    const packageManager = useYarn ? 'yarn' : 'npm';

    //  install command
    const depsToInstall = dependencies.map((dep) => `${dep.name}@${dep.version}`).join(' ');

    console.log(`    使用 ${packageManager} 安装: ${depsToInstall}`);

    return new Promise<void>((resolve, reject) => {
      const command = useYarn ? `yarn add ${depsToInstall}` : `npm install ${depsToInstall}`;

      child_process.exec(command, { cwd: projectRoot }, (error, _stdout, stderr) => {
        if (error) {
          console.error(`    ${packageManager} 安装Failed:`, stderr);
          reject(new Error(`npm Dependencies安装Failed: ${stderr}`));
          return;
        }

        console.log(`    ${packageManager} DependenciesInstallation successful`);
        resolve();
      });
    });
  }
}
