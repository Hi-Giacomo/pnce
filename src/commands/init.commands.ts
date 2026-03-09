import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  validateModuleName,
  normalizeModuleName,
  normalizeCamelCase,
  normalizeFileName,
} from '../utils';
import { generateMicroserviceFiles, createProjectStructure } from '../templates';
import { ErrorHandler } from '../utils/errors';

/**
 * 注册初始化相关命令
 * @param program - Commander程序实例
 */
export function registerInitCommands(program: Command): void {
  // 初始化命令
  program
    .command('init [name]')
    .description('初始化项目（微服务或服务）')
    .option('-d, --directory <dir>', '项目目录路径（默认为当前目录）')
    .option('-t, --type <type>', '项目类型: microservice (微服务) 或 service (服务)', 'service')
    .action(async (name, options) => {
      // 获取初始工作目录
      let initialCwd = process.env.INIT_CWD || process.cwd();

      // 尝试从环境变量读取临时文件路径
      if (process.env.MODULE_INIT_CWD_FILE && fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        initialCwd = fs.readFileSync(process.env.MODULE_INIT_CWD_FILE, 'utf-8').trim();
        // 删除临时文件
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }

      let targetDir;
      if (name) {
        // 如果提供了模块名称，创建以名称命名的目录
        targetDir = path.resolve(initialCwd, name);
      } else {
        // 如果没有提供名称，使用 -d 选项指定的目录或当前目录
        targetDir = options.directory ? path.resolve(initialCwd, options.directory) : initialCwd;
      }

      // 确定模块名称
      const moduleName = name || path.basename(targetDir);

      // 验证模块名称
      const validation = validateModuleName(moduleName);
      if (!validation.valid) {
        console.error('❌ 模块名称验证失败:');
        console.error(validation.error);
        console.error('');
        console.error('💡 命名建议:');
        console.error('   - 使用字母开头: my-module, user-service, demo-app');
        console.error('   - 可包含连字符或下划线: my_module_1, user-service-v2');
        console.error('   - 避免纯数字或数字开头: ❌ 123, 1module');
        return;
      }

      // 规范化模块名称用于类名和标识符
      const normalizedClassName = normalizeModuleName(moduleName);
      const normalizedCamelCase = normalizeCamelCase(moduleName);
      const normalizedFileName = normalizeFileName(moduleName);

      // 验证项目类型
      if (options.type !== 'microservice' && options.type !== 'service') {
        console.error('❌ 项目类型必须是 microservice 或 service');
        return;
      }

      // 如果是服务类型
      if (options.type === 'service') {
        const projectPath = targetDir;
        if (fs.existsSync(projectPath)) {
          console.error('❌ 目录已存在');
          return;
        }

        console.log(`\n🚀 创建服务项目: ${moduleName}`);
        console.log(`📁 目标目录: ${projectPath}\n`);

        try {
          await createProjectStructure(projectPath, moduleName);
          console.log(`\n✅ 服务项目 ${moduleName} 创建成功！\n`);
          console.log('📋 下一步操作:');
          console.log(`   cd ${moduleName}`);
          console.log('   npm install');
          console.log('   npm run dev\n');
        } catch (error) {
          ErrorHandler.handle(error);
        }
        return;
      }

      // 如果是微服务类型
      const packageJsonPath = path.join(targetDir, 'package.json');

      // 检查文件是否存在
      if (fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json 已存在');
        return;
      }

      // 确保目录存在
      fs.ensureDirSync(targetDir);

      // 创建微服务模块
      generateMicroserviceFiles(
        targetDir,
        moduleName,
        normalizedClassName,
        normalizedCamelCase,
        normalizedFileName
      );
    });
}
