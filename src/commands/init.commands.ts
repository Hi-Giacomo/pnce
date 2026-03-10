import { command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  validatemoduleName,
  normalizemoduleName,
  normalizeCamelCase,
  normalizeFileName,
} from '../utils';
import { generateMicroserviceFiles, createProjectStructure } from '../templates';
import { ErrorHandler } from '../utils/errors';

/**
 * command
 * @param program - commander program instance
 */
export function registerInitcommands(program: command): void {
  // command
  program
    .command('init [name]')
    .description('Initialize project（微服务或服务）')
    .option('-d, --directory <dir>', '项目Directory路径（Default为CurrentDirectory）')
    .option('-t, --type <type>', 'Project type: microservice (微服务) 或 service (服务)', 'service')
    .action(async (name, options) => {
      // Directory
      let initialCwd = process.env.INIT_CWD || process.cwd();

      // Environment variablesFile
      if (process.env.MODULE_INIT_CWD_FILE && fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        initialCwd = fs.readFileSync(process.env.MODULE_INIT_CWD_FILE, 'utf-8').trim();
        // File
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }

      let targetDir;
      if (name) {
        // module name，Directory
        targetDir = path.resolve(initialCwd, name);
      } else {
        // ， -d DirectoryCurrentDirectory
        targetDir = options.directory ? path.resolve(initialCwd, options.directory) : initialCwd;
      }

      // module name
      const moduleName = name || path.basename(targetDir);

      // Validationmodule name
      const validation = validatemoduleName(moduleName);
      if (!validation.valid) {
        console.error('❌ module nameValidationFailed:');
        console.error(validation.error);
        console.error('');
        console.error('💡 命名建议:');
        console.error('   - 使用字母开头: my-module, user-service, demo-app');
        console.error('   - 可包含连字符或下划线: my_module_1, user-service-v2');
        console.error('   - 避免纯数字或数字开头: ❌ 123, 1module');
        return;
      }

      // module name
      const normalizedClassName = normalizemoduleName(moduleName);
      const normalizedCamelCase = normalizeCamelCase(moduleName);
      const normalizedFileName = normalizeFileName(moduleName);

      // ValidationProject type
      if (options.type !== 'microservice' && options.type !== 'service') {
        console.error('❌ Project type必须Yes microservice 或 service');
        return;
      }

      // YesType
      if (options.type === 'service') {
        const projectPath = targetDir;
        if (fs.existsSync(projectPath)) {
          console.error('❌ Directory已存在');
          return;
        }

        console.log(`\n🚀 创建服务项目: ${moduleName}`);
        console.log(`📁 目标Directory: ${projectPath}\n`);

        try {
          await createProjectStructure(projectPath, moduleName);
          console.log(`\n✅ 服务项目 ${moduleName} 创建Success！\n`);
          console.log('📋 下一步操作:');
          console.log(`   cd ${moduleName}`);
          console.log('   npm install');
          console.log('   npm run dev\n');
        } catch (error) {
          ErrorHandler.handle(error);
        }
        return;
      }

      // YesType
      const packageJsonPath = path.join(targetDir, 'package.json');

      // FileYesNo
      if (fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json 已存在');
        return;
      }

      // Directory
      fs.ensureDirSync(targetDir);

      // module
      generateMicroserviceFiles(
        targetDir,
        moduleName,
        normalizedClassName,
        normalizedCamelCase,
        normalizedFileName
      );
    });
}
