import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';
import * as crypto from 'crypto';
import FormData = require('form-data');
import { ApiService } from './api.service';
import { PackageJson, ModuleInformation, versionInfo, Stats, ApiResponse } from '../types';

/**
 * module
 * module、version
 */
export class ModuleService {
  constructor(private api: ApiService) {}

  /**
   * Directory(Allfile)
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
          //  lock filefile
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
    const hashfilePath = path.join(modulePath, '.module-hash');
    await fs.writeFile(hashfilePath, hash);
  }

  /**
   * moduleYes/No
   * @param moduleName module name
   * @param targetversion version
   * @param installDir Directory（ projectRoot）
   * @param projectRoot Directory
   * @returns { isInstalled: boolean, needsUpdate: boolean, installedversion: string | null, installedName: string | null }
   */
  async checkModuleStatus(
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

    // DirectoryYes/No
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
    const installedversion = moduleConfig.version || null;
    const installedName = moduleConfig.name || null;

    // version，
    if (installedversion !== targetVersion) {
      return {
        isInstalled: true,
        needsUpdate: true,
        installedVersion: installedversion,
        installedName,
      };
    }

    // version，(，)
    return {
      isInstalled: true,
      needsUpdate: false,
      installedVersion: installedversion,
      installedName,
    };
  }

  async upload(moduleDir: string): Promise<void> {
    // Directory（npm/yarn  INIT_CWD  cwd）
    const initialCwd = process.env.INIT_CWD || process.cwd();

    // （Directory）
    const absolutemoduleDir = path.resolve(initialCwd, moduleDir);

    //  package.json
    const packageJsonPath = path.join(absolutemoduleDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Error:  package.json file: ${packageJsonPath}`);
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
    const moduleversion = packageJson.version;
    const moduleDescription = packageJson.description || '';

    if (!moduleName || !moduleversion) {
      throw new Error('Error: package.json Medium name  version ');
    }

    console.log(`ProcessingPackagemodule ${moduleName}@${moduleversion}...`);
    console.log(`Name: ${moduleName}`);
    console.log(`version: ${moduleversion}`);
    console.log(`Description: ${moduleDescription}`);
    if (type) {
      console.log(`Type: ${type}`);
    }
    if (appId) {
      console.log(`ApplicationID: ${appId}`);
    }
    if (teamId) {
      console.log(`TeamID: ${teamId}`);
    }
    console.log(': AuthorInfologinGet');

    //  .tgz file file（UserDirectory .module-temp）
    const tempDir = path.join(require('os').homedir(), '.module-temp');
    fs.ensureDirSync(tempDir);
    const tgzFilePath = path.join(tempDir, `${moduleName}-${moduleversion}.tgz`);

    console.log(`module directory: ${absolutemoduleDir}`);
    console.log(`Temporaryfile: ${tgzFilePath}`);

    //  .npmignore ， external_modules/ Directory
    await this.ensureNpmignore(absolutemoduleDir);

    await this.createPackage(absolutemoduleDir, tgzFilePath);

    console.log('UploadMedium...');

    // （ author ）
    const formData = new FormData();
    formData.append('package', fs.createReadStream(tgzFilePath));
    formData.append('name', moduleName);
    formData.append('version', moduleversion);
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

    const response = await this.api.post<ApiResponse<{ module: ModuleInformation }>>(
      '/api/modules/upload',
      formData,
      true
    );

    if (response.success && response.module) {
      console.log(`✓ module ${moduleName}@${moduleversion} UploadSuccess!`);
      if (response.module.author) {
        console.log(`  Author: ${response.module.author}`);
      }
    } else {
      throw new Error(response.message || 'Uploadfailed');
    }

    // file
    fs.removeSync(tempDir);
  }

  async install(moduleName: string, version?: string, installDir = 'node_modules'): Promise<void> {
    // Directory（npm/yarn  INIT_CWD  cwd）
    const initialCwd = process.env.INIT_CWD || process.cwd();

    let targetversion = version;
    const installPath = path.resolve(initialCwd, installDir, moduleName);

    // version，version
    if (!targetversion) {
      console.log(`Get ${moduleName} Latestversion...`);
      const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
        `/api/modules/${moduleName}`
      );

      if (!response.success || !response.module) {
        throw new Error(response.message || 'GetModuleInformationfailed');
      }

      targetversion = response.module.latest;
    }

    //  targetversion
    if (!targetversion) {
      throw new Error('module version');
    }

    // module status
    const moduleStatus = await this.checkModuleStatus(
      moduleName,
      targetversion,
      installDir,
      initialCwd
    );

    if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
      console.log(
        `🔄 ${moduleName} Install${moduleStatus.installedVersion ? ` (Current: ${moduleStatus.installedVersion})` : ''}...`
      );
    }

    console.log(`Download ${moduleName}@${targetversion}...`);

    const downloadUrl = `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetversion}/download`;

    const axios = (await import('axios')).default;
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: this.api['getAuthHeaders']?.() || {},
    });

    const tempDir = path.join(require('os').homedir(), '.module-temp');
    fs.ensureDirSync(tempDir);
    const tgzFilePath = path.join(tempDir, `${moduleName}-${targetversion}.tgz`);
    const writer = fs.createWriteStream(tgzFilePath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    console.log('ExtractMedium...');

    await this.extractTgz(tgzFilePath, installPath);
    fs.unlinkSync(tgzFilePath);

    console.log(`✓ module ${moduleName}@${targetversion} installation successful!`);

    // （，All）
    const moduleHash = await this.calculateDirectoryHash(installPath);
    await this.savemoduleHash(installPath, moduleHash);

    // dependencies
    await this.installdependencies(moduleName, installPath, initialCwd);

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
  private async fixModuleImportsForModule(
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

    // All .ts file
    const tsfiles: string[] = [];
    const walkDir = async (dir: string) => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await walkDir(filePath);
        } else if (file.endsWith('.ts')) {
          tsfiles.push(filePath);
        }
      }
    };

    await walkDir(parentSrcPath);

    console.log(`      [ImportPath] check ${tsfiles.length} fileMedium ${moduleName} ...`);

    for (const filePath of tsfiles) {
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

        // Currentfilemodule
        const targetRealPath = path.join(actualmodulePath, sourcePath);

        //  index ，module index.ts
        const relativePath = path.relative(path.dirname(filePath), targetRealPath);
        const normalizedPath = relativePath.replace(/\\/g, '/');

        //
        const newImportStatement = importStatement.replace(/['"][^'"]+['"]/, `'${normalizedPath}'`);

        content = content.replace(importStatement, newImportStatement);
        modified = true;

        console.log(`        : ${fullImportPath} -> ${normalizedPath}`);
      }

      if (modified) {
        await fs.writeFile(filePath, content, 'utf-8');
      }
    }
  }

  /**
   * moduleAlldependencies
   * @param modulePath module
   * @param projectRoot Directory
   */
  async fixImportFormodule(modulePath: string, projectRoot: string): Promise<void> {
    const moduleConfigPath = path.join(modulePath, 'module.config.json');
    const moduleName = path.basename(modulePath);

    if (!(await fs.pathExists(moduleConfigPath))) {
      console.log(`⚠️  module ${moduleName}  module.config.json，Skip`);
      return;
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedModules = moduleConfig.installedModules;

    if (!installedModules || Object.keys(installedModules).length === 0) {
      console.log(`✓ module ${moduleName} Configuredependencies，`);
      return;
    }

    console.log(
      `module ${moduleName} Configuredependencies: ${Object.keys(installedModules).join(', ')}\n`
    );

    for (const [depName, depversion] of Object.entries(installedModules)) {
      const version = String(depversion);

      console.log(`  Handledependencies ${depName}@${version}...`);

      // Yes/NoDirectorymodule
      const existingmodulePath = await this.findExistingmoduleInAncestors(
        depName,
        version,
        modulePath,
        projectRoot
      );

      if (existingmodulePath) {
        console.log(`    ✓ ParentDirectory ${depName}@${version}`);
        console.log(`    📝 ImportPath: ${path.relative(projectRoot, existingmodulePath)}`);

        //
        const depInstallPath = path.join(modulePath, 'external_modules', depName);
        await this.fixModuleImportsForModule(
          modulePath,
          existingmodulePath,
          depInstallPath,
          projectRoot,
          depName
        );
      } else {
        console.log(`    ⚠️  ParentDirectory ${depName}@${version}，Skip`);
      }
    }
  }

  async list(): Promise<void> {
    const response =
      await this.api.get<ApiResponse<{ modules: ModuleInformation[] }>>('/api/modules');

    if (!response.success || !response.modules) {
      throw new Error(response.message || 'Getmodule listfailed');
    }

    const modules = response.modules;

    if (modules.length === 0) {
      console.log('module');
      return;
    }

    console.log('\nmodule list:');
    console.log('─'.repeat(80));
    modules.forEach((mod: ModuleInformation) => {
      const typeLabel = mod.type ? ` [${mod.type}]` : '';
      console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
      console.log(`  Description: ${mod.description || ''}`);
      console.log(`  Author: ${mod.author}${mod.uploadedBy ? ` (${mod.uploadedBy})` : ''}`);
      console.log(`  version: ${Object.keys(mod.versions).length}`);
      console.log('─'.repeat(80));
    });
  }

  async search(query: string): Promise<void> {
    const response = await this.api.get<ApiResponse<{ modules: ModuleInformation[] }>>(
      `/api/modules?q=${encodeURIComponent(query)}`
    );

    if (!response.success || !response.modules) {
      throw new Error(response.message || 'Search failed');
    }

    const modules = response.modules;

    if (modules.length === 0) {
      console.log('Matchmodule');
      return;
    }

    console.log(`\nSearch "${query}" Result:`);
    console.log('─'.repeat(80));
    modules.forEach((mod: ModuleInformation) => {
      const typeLabel = mod.type ? ` [${mod.type}]` : '';
      console.log(`  ${mod.name}@${mod.latest}${typeLabel}`);
      console.log(`  Description: ${mod.description || ''}`);
      console.log(`  Author: ${mod.author}`);
      console.log('─'.repeat(80));
    });
  }

  async info(moduleName: string): Promise<void> {
    const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );

    if (!response.success || !response.module) {
      throw new Error(response.message || 'GetModuleInformationfailed');
    }

    const module = response.module;

    console.log(`\nModuleInformation:`);
    console.log('─'.repeat(40));
    console.log(`Name: ${module.name}`);
    console.log(`Description: ${module.description || ''}`);
    console.log(`Type: ${module.type || 'Category'}`);
    console.log(`Author: ${module.author}${module.uploadedBy ? ` (${module.uploadedBy})` : ''}`);
    console.log(`Create: ${module.createdAt}`);
    console.log(`Latestversion: ${module.latest}`);
    if (module.appId) {
      console.log(`ApplicationID: ${module.appId}`);
    }
    if (module.teamId) {
      console.log(`TeamID: ${module.teamId}`);
    }
    console.log(`\nAllversion:`);
    Object.keys(module.versions).forEach((version: string) => {
      const v = module.versions as Record<string, versionInfo>;
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
      throw new Error(response.message || 'GetStatisticsInfofailed');
    }

    const stats = response.stats;
    console.log('\nRegisterMediumStatistics:');
    console.log('─'.repeat(40));
    console.log(`moduleTotal: ${stats.totalmodules}`);
    console.log(`versionTotal: ${stats.totalversions}`);
    console.log(`Size: ${this.formatSize(stats.totalSize)}`);

    if (stats.topAuthors && stats.topAuthors.length > 0) {
      console.log('\nAuthor:');
      stats.topAuthors.forEach((item: { author: string; count: number }) => {
        console.log(`  ${item.author}: ${item.count} module`);
      });
    }
  }

  private createPackage(moduleDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      //  npm pack  ..tgz file
      child_process.exec('npm pack', { cwd: moduleDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Packagefailed: ${stderr}`));
          return;
        }

        // npm pack Yesfile
        const generatedfileName = stdout.trim();

        if (!generatedfileName) {
          reject(new Error('npm pack Returnfile'));
          return;
        }

        const tgzFilePath = path.join(moduleDir, generatedfileName);

        // fileYes/No
        if (!fs.existsSync(tgzFilePath)) {
          reject(new Error(`Package file does not exist: ${tgzFilePath}`));
          return;
        }

        //  ..tgz file file
        fs.moveSync(tgzFilePath, outputPath, { overwrite: true });
        resolve();
      });
    });
  }

  private extractTgz(tgzFilePath: string, extractDir: string): Promise<void> {
    const tar = require('tar');
    // tarball  package Directory
    return new Promise((resolve, reject) => {
      fs.ensureDirSync(extractDir);
      tar
        .x({
          file: tgzFilePath,
          cwd: extractDir,
          strip: 1, //  package Directory
        })
        .then(() => {
          //  tarball file（npm pack ）
          const tarballfiles = fs.readdirSync(extractDir).filter((f) => f.endsWith('..tgz file'));
          tarballfiles.forEach((f) => fs.removeSync(path.join(extractDir, f)));
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
   *  .npmignore file，Directory
   * @param moduleDir module directory
   */
  private async ensureNpmignore(moduleDir: string): Promise<void> {
    const npmignorePath = path.join(moduleDir, '.npmignore');

    if (!fs.existsSync(npmignorePath)) {
      const defaultIgnore = [
        '# External modules (Package， modules.json RunInstall）',
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
      console.log('  ✓ Create .npmignore file（Exclude external_modules， local_modules）');
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
          '# External modules (Package， modules.json RunInstall）',
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
        console.log('  ✓ Update .npmignore file（Exclude external_modules， local_modules）');
      }
    }
  }

  /**
   * module dependencies
   * @param moduleName module name
   * @param modulePath module
   * @param projectRoot Directory
   */
  private async installdependencies(
    moduleName: string,
    modulePath: string,
    projectRoot: string
  ): Promise<void> {
    // module package.json
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log(
        `  [dependencies] module ${moduleName} package.json not found, skip dependencies install`
      );
      return;
    }

    const packageJson = fs.readJsonSync(packageJsonPath);
    const dependencies = packageJson.dependencies || {};
    const localModules = packageJson.localModules || {};

    if (Object.keys(dependencies).length === 0) {
      console.log(`  [dependencies] module ${moduleName} has no dependencies in package.json`);
    }

    console.log(`\n  [dependencies] Startmodule ${moduleName} dependencies...`);

    // Categorydependencies（ npm ， @module-registry/ dependencies）
    const npmdependencies: Array<{ name: string; version: string }> = [];

    for (const [depName, depversion] of Object.entries(dependencies)) {
      if (depName === '@module-registry/custom-service-core') {
        //  - （）
        console.log(`    - SkipFramework: ${depName} (ProjectPackage)`);
      } else if (depName.startsWith('@module-registry/')) {
        // @module-registry/ dependencies， modules.json
        console.log(
          `    - module dependencies（ modules.json Manage）: ${depName}${depversion ? '@' + depversion : ''}`
        );
      } else {
        //  npm  -  npm/yarn
        npmdependencies.push({ name: depName, version: depversion as string });
        console.log(`    - npm dependencies: ${depName}${depversion ? '@' + depversion : ''}`);
      }
    }

    //  package.json Localmodule dependencies（local_modules）
    if (localModules && Object.keys(localModules).length > 0) {
      console.log(
        `\n  [package.json] module ${moduleName} Localservicedependencies (local_modules)...`
      );

      // dependenciesDirectory：Currentmodule src/local_modules/
      //  external_modules ， src Directory
      const localModulesPath = path.join(modulePath, 'src', 'local_modules');

      for (const [depName, depversion] of Object.entries(localModules)) {
        const version = String(depversion);
        console.log(`    - local_modules dependencies: ${depName}@${version}`);

        // dependenciesmodule src/local_modules/
        const depInstallPath = path.join(localModulesPath, depName);
        console.log(
          `[DEBUG] checking if ${depInstallPath} exists: ${fs.existsSync(depInstallPath)}`
        );

        if (!fs.existsSync(depInstallPath)) {
          console.log(`    Install local_modules dependencies: ${depName}  ${localModulesPath}...`);

          // DirectoryYes/Nomodule
          const existingmodulePath = await this.findExistingmoduleInAncestors(
            depName,
            version,
            modulePath,
            projectRoot
          );

          if (existingmodulePath) {
            // Directorymodule，
            console.log(
              `    🔗 ParentDirectoryMedium ${depName}@${version}，ImportPath ${existingmodulePath}`
            );

            // ，/
            await this.createSymlinkOrCopy(
              existingmodulePath,
              depInstallPath,
              modulePath,
              depName,
              projectRoot
            );

            // dependencies
            await this.installdependencies(depName, existingmodulePath, projectRoot);
          } else {
            // ，
            console.log(`    ParentDirectoryMedium ${depName}，StartDownloadInstall...`);

            // （module modules.json， local_modules  external_modules）
            const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');

            // version
            let targetversion = version;
            if (version.startsWith('^') || version.startsWith('~')) {
              // ModuleInformationversion
              const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
                `/api/modules/${depName}`
              );
              if (response.success && response.module) {
                // version：version
                targetversion = response.module.latest;
              }
            }

            // module src/local_modules/ Directory
            //  projectRoot
            const installDir = path.relative(projectRoot, relativeInstallDir);
            await this.install(depName, targetversion, installDir);
          }
        } else {
          console.log(`    local_modules dependencies ${depName} Install，checkdependencies...`);
          // module，dependencies
          await this.installdependencies(depName, depInstallPath, projectRoot);
        }
      }
    }

    //  modules.json Localmodule dependencies（local_modules）
    const modulesJsonPath = path.join(modulePath, 'modules.json');
    console.log(
      `[DEBUG] modulesJsonPath: ${modulesJsonPath}, exists: ${fs.existsSync(modulesJsonPath)}`
    );
    if (fs.existsSync(modulesJsonPath)) {
      try {
        const modulesConfig = fs.readJsonSync(modulesJsonPath);
        console.log(`[DEBUG] modulesConfig: ${JSON.stringify(modulesConfig)}`);

        if (modulesConfig.localModules && Object.keys(modulesConfig.localModules).length > 0) {
          console.log(
            `\n  [modules.json] module ${moduleName} Localservicedependencies (local_modules)...`
          );

          // dependenciesDirectory：Currentmodule src/local_modules/
          //  external_modules ， src Directory
          const localModulesPath = path.join(modulePath, 'src', 'local_modules');

          for (const [depName, depversion] of Object.entries(modulesConfig.localModules)) {
            const version = String(depversion);
            console.log(`    - local_modules dependencies: ${depName}@${version}`);

            // dependenciesmodule src/local_modules/
            const depInstallPath = path.join(localModulesPath, depName);

            if (!fs.existsSync(depInstallPath)) {
              console.log(
                `    Install local_modules dependencies: ${depName}  ${localModulesPath}...`
              );

              // DirectoryYes/Nomodule
              const existingmodulePath = await this.findExistingmoduleInAncestors(
                depName,
                version,
                modulePath,
                projectRoot
              );

              if (existingmodulePath) {
                // Directorymodule，
                console.log(
                  `    🔗 ParentDirectoryMedium ${depName}@${version}，CreateLink ${existingmodulePath}`
                );

                const linkPath = depInstallPath;

                // ，
                if (await fs.pathExists(linkPath)) {
                  await fs.remove(linkPath);
                }

                //
                await fs.ensureSymlink(existingmodulePath, linkPath);
                console.log(`    ✓ LinkCreateSuccess: ${linkPath} -> ${existingmodulePath}`);

                // dependencies
                await this.installdependencies(depName, linkPath, projectRoot);
              } else {
                // ，
                console.log(`    ParentDirectoryMedium ${depName}，StartDownloadInstall...`);

                // （module modules.json， local_modules  external_modules）
                const relativeInstallDir = path.join(modulePath, 'src', 'local_modules');

                // version
                let targetversion = version;
                if (version.startsWith('^') || version.startsWith('~')) {
                  // ModuleInformationversion
                  const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
                    `/api/modules/${depName}`
                  );
                  if (response.success && response.module) {
                    // version：version
                    targetversion = response.module.latest;
                  }
                }

                // module src/local_modules/ Directory
                //  projectRoot
                const installDir = path.relative(projectRoot, relativeInstallDir);
                await this.install(depName, targetversion, installDir);
              }
            } else {
              console.log(
                `    local_modules dependencies ${depName} Install，checkdependencies...`
              );
              // module，dependencies（ externalModules  localModules）
              await this.installdependencies(depName, depInstallPath, projectRoot);
            }
          }
        }

        //  modules.json module dependencies（）
        if (
          modulesConfig.externalModules &&
          Object.keys(modulesConfig.externalModules).length > 0
        ) {
          console.log(
            `\n  [modules.json] module ${moduleName} Externalservicedependencies (external_modules)...`
          );

          // dependenciesDirectory：Currentmodule src/external_modules/
          //  modulePath Yes projectRoot/src/external_modules/user
          // dependencies projectRoot/src/external_modules/user/src/external_modules/
          const parentExternalmodulesPath = path.join(modulePath, 'src', 'external_modules');

          for (const [depName, depversion] of Object.entries(modulesConfig.externalModules)) {
            const version = String(depversion);
            console.log(`    - external_modules dependencies: ${depName}@${version}`);

            // dependenciesmodule src/external_modules/
            const depInstallPath = path.join(parentExternalmodulesPath, depName);

            if (!fs.existsSync(depInstallPath)) {
              console.log(
                `    Install external_modules dependencies: ${depName}  ${parentExternalmodulesPath}...`
              );

              // DirectoryYes/Nomodule
              const existingmodulePath = await this.findExistingmoduleInAncestors(
                depName,
                version,
                modulePath,
                projectRoot
              );

              if (existingmodulePath) {
                // Directorymodule，
                console.log(
                  `    🔗 ParentDirectoryMedium ${depName}@${version}，CreateLink ${existingmodulePath}`
                );

                const linkPath = depInstallPath;

                // ，
                if (await fs.pathExists(linkPath)) {
                  await fs.remove(linkPath);
                }

                //
                await fs.ensureSymlink(existingmodulePath, linkPath);
                console.log(`    ✓ LinkCreateSuccess: ${linkPath} -> ${existingmodulePath}`);

                // dependencies
                await this.installdependencies(depName, linkPath, projectRoot);
              } else {
                // ，
                console.log(`    ParentDirectoryMedium ${depName}，StartDownloadInstall...`);

                // （module modules.json）
                // ：src/external_modules -> module directory
                const relativeInstallDir = path.join(modulePath, 'src', 'external_modules');

                // version
                let targetversion = version;
                if (version.startsWith('^') || version.startsWith('~')) {
                  // ModuleInformationversion
                  const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
                    `/api/modules/${depName}`
                  );
                  if (response.success && response.module) {
                    // version：version
                    targetversion = response.module.latest;
                  }
                }

                // module src/external_modules/ Directory
                //  projectRoot
                const installDir = path.relative(projectRoot, relativeInstallDir);
                await this.install(depName, targetversion, installDir);
              }
            } else {
              console.log(
                `    external_modules dependencies ${depName} Install，checkdependencies...`
              );
              // module，dependencies（ externalModules  localModules）
              await this.installdependencies(depName, depInstallPath, projectRoot);
            }
          }
        }
      } catch (error: unknown) {
        console.error(
          `  [modules.json]  ${moduleName}  modules.json failed:`,
          error instanceof Error ? error.message : String(error)
        );
        // Error，
      }
    }

    //  npm dependencies
    if (npmdependencies.length > 0) {
      console.log(`\n  [dependencies] Install npm dependencies...`);
      await this.installNpmdependencies(npmdependencies, projectRoot);
    }

    console.log(`\n  [dependencies] module ${moduleName} dependenciesInstallComplete`);
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
    const installedModules = moduleConfig.installedModules;

    if (!installedModules || Object.keys(installedModules).length === 0) {
      return;
    }

    const moduleName = path.basename(modulePath);
    console.log(
      `\n  [module.config.json] ${moduleName} Configuremodule: ${Object.keys(installedModules).join(', ')}`
    );

    for (const [modName, modversion] of Object.entries(installedModules)) {
      const version = String(modversion);
      console.log(`    - ${modName}@${version}`);

      try {
        // moduleCurrentmodule external_modules Directory
        // ：s3  s2/src/external_modules/s3
        //       s4  s2/src/external_modules/s3/external_modules
        const submoduleInstallDir = path.join(modulePath, 'external_modules');

        // Directory
        const relativeInstallDir = path.relative(projectRoot, submoduleInstallDir);

        // Yes/NoDirectorymodule
        // ：Directory，LocalYes/No
        // LocalYes
        console.log(`      🔍 ParentDirectorySearch ${modName}@${version}...`);
        const existingmodulePath = await this.findExistingmoduleInAncestors(
          modName,
          version,
          modulePath,
          projectRoot
        );

        const depInstallPath = path.join(projectRoot, relativeInstallDir, modName);

        if (existingmodulePath) {
          // Directorymodule
          console.log(`      🔗 ParentDirectory ${modName}@${version}，ImportPath`);

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
          // moduleYes/No
          const moduleStatus = await this.checkModuleStatus(
            modName,
            version,
            relativeInstallDir,
            projectRoot
          );

          if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
            console.log(`      ⏭️  ${modName}@${version} Install（SkipDownload）`);
            // ，module
            await this.installConfiguredmodules(depInstallPath, projectRoot);
          } else {
            // module
            if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
              console.log(`      🔄 ${modName} Install...`);
            } else {
              console.log(`      ⬇️  DownloadInstall ${modName}@${version}...`);
            }

            await this.install(modName, version, relativeInstallDir);

            //
            console.log(`      🔧  ${moduleName} Medium ${modName} ImportPath...`);
            await this.fixModuleImportsForModule(
              modulePath,
              depInstallPath,
              depInstallPath,
              projectRoot
            );
          }
        }
      } catch (error: unknown) {
        console.error(
          `      ❌ Install ${modName} failed:`,
          error instanceof Error ? error.message : String(error)
        );
        // Othermodule
      }
    }
  }

  /**
   * Directorymodule
   * @param moduleName module name
   * @param targetversion version
   * @param currentmodulePath Currentmodule
   * @param projectRoot Directory
   * @returns module， null
   */
  private async findExistingmoduleInAncestors(
    moduleName: string,
    targetversion: string,
    currentmodulePath: string,
    projectRoot: string
  ): Promise<string | null> {
    console.log(`[findExistingmoduleInAncestors] StartSearch ${moduleName}@${targetversion}`);
    console.log(`[findExistingmoduleInAncestors] currentmodulePath: ${currentmodulePath}`);
    console.log(`[findExistingmoduleInAncestors] projectRoot: ${projectRoot}`);

    // Directory src/external_modules
    const projectExternalmodulesPath = path.join(projectRoot, 'src', 'external_modules');
    console.log(`[findExistingmoduleInAncestors] check: ${projectExternalmodulesPath}`);

    const projectmodulePath = path.join(projectExternalmodulesPath, moduleName);
    if (await fs.pathExists(projectmodulePath)) {
      const relativePath = 'src/external_modules';
      console.log(`[findExistingmoduleInAncestors] moduleProjectRootDirectory`);
      const moduleStatus = await this.checkModuleStatus(
        moduleName,
        targetversion,
        relativePath,
        projectRoot
      );

      if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
        console.log(`      ✓ ProjectRootDirectory ${relativePath}  ${moduleName}@${targetversion}`);
        return projectmodulePath;
      } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
        console.log(`      ⚠️  ProjectRootDirectory ${moduleName}，Update`);
      }
    }

    // CurrentmoduleStart，All external_modules Directory
    let searchPath = path.normalize(path.dirname(currentmodulePath));
    const normalizedProjectRoot = path.normalize(projectRoot);

    console.log(`[findExistingmoduleInAncestors] Start, Path: ${searchPath}`);

    // Directory
    while (searchPath.startsWith(normalizedProjectRoot)) {
      console.log(`[findExistingmoduleInAncestors] checkPath: ${searchPath}`);

      // Current directoryYes external_modules，
      if (searchPath.endsWith('external_modules')) {
        const modulePath = path.join(searchPath, moduleName);
        console.log(`[findExistingmoduleInAncestors] checkmodule: ${modulePath}`);

        if (await fs.pathExists(modulePath)) {
          // moduleversionStatus
          const relativePath = path.relative(projectRoot, searchPath);
          console.log(`[findExistingmoduleInAncestors] module, relativePath: ${relativePath}`);
          const moduleStatus = await this.checkModuleStatus(
            moduleName,
            targetversion,
            relativePath,
            projectRoot
          );

          if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
            console.log(`      ✓  ${relativePath}  ${moduleName}@${targetversion}，Install`);
            // module
            return path.join(projectRoot, relativePath, moduleName);
          } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
            console.log(`      ⚠️   ${relativePath}  ${moduleName}，CodeversionMatch`);
          }
        }
      } else {
        // Current directoryYes external_modules，Yes/No external_modules Directory
        const externalModulesPath = path.join(searchPath, 'external_modules');
        console.log(`[findExistingmoduleInAncestors] checkChildDirectory: ${externalModulesPath}`);

        if (await fs.pathExists(externalModulesPath)) {
          const modulePath = path.join(externalModulesPath, moduleName);
          console.log(`[findExistingmoduleInAncestors] checkmodule: ${modulePath}`);

          if (await fs.pathExists(modulePath)) {
            // moduleversionStatus
            const relativePath = path.relative(projectRoot, externalModulesPath);
            console.log(`[findExistingmoduleInAncestors] module, relativePath: ${relativePath}`);
            const moduleStatus = await this.checkModuleStatus(
              moduleName,
              targetversion,
              relativePath,
              projectRoot
            );

            if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
              console.log(`      ✓  ${relativePath}  ${moduleName}@${targetversion}，Install`);
              // module
              return path.join(projectRoot, relativePath, moduleName);
            } else if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
              console.log(`      ⚠️   ${relativePath}  ${moduleName}，CodeversionMatch`);
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

    console.log(`      ℹ️  ParentDirectory ${moduleName}@${targetversion}`);
    return null;
  }

  /**
   * （/）
   *  Windows ，failed（EPERM ）
   * module
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
    // Windows failed，
    console.log(`    📝 ImportPath: ${path.relative(projectRoot, sourcePath)}`);
    await this.fixModuleImportsForModule(
      parentmodulePath,
      sourcePath,
      targetPath,
      projectRoot,
      moduleName
    );
  }

  /**
   *  npm dependencies
   * @param dependencies npm dependencies list
   * @param projectRoot Directory
   */
  private async installNpmdependencies(
    dependencies: Array<{ name: string; version: string }>,
    projectRoot: string
  ): Promise<void> {
    //  npm Yes yarn
    const useYarn = fs.existsSync(path.join(projectRoot, 'yarn.lock'));
    const packageManager = useYarn ? 'yarn' : 'npm';

    //  install command
    const depsToInstall = dependencies.map((dep) => `${dep.name}@${dep.version}`).join(' ');

    console.log(`    Use ${packageManager} Install: ${depsToInstall}`);

    return new Promise<void>((resolve, reject) => {
      const command = useYarn ? `yarn add ${depsToInstall}` : `npm install ${depsToInstall}`;

      child_process.exec(command, { cwd: projectRoot }, (error, _stdout, stderr) => {
        if (error) {
          console.error(`    ${packageManager} Installfailed:`, stderr);
          reject(new Error(`npm dependenciesInstallfailed: ${stderr}`));
          return;
        }

        console.log(`    ${packageManager} dependenciesinstallation successful`);
        resolve();
      });
    });
  }
}
