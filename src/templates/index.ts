import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * 模板类型
 */
export type TemplateType = 'service' | 'microservice';

/**
 * 模板信息接口
 */
export interface Template {
  type: TemplateType;
  name: string;
  description: string;
  path: string;
}

/**
 * 模板目录列表
 */
const TEMPLATE_DIRS: TemplateType[] = ['service', 'microservice'];

/**
 * 模板描述信息
 */
const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string }> = {
  service: {
    name: '主服务',
    description: 'NestJS主服务项目模板',
  },
  microservice: {
    name: '微服务',
    description: 'NestJS微服务模块模板',
  },
};

/**
 * 获取模板基础目录
 */
function getTemplatesBaseDir(): string {
  // 开发环境使用 src/templates，生产环境使用 dist/templates
  const isDev = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'templates'));
  if (isDev) {
    return path.join(__dirname, '..', '..', 'src', 'templates');
  }
  return path.join(__dirname);
}

/**
 * 获取指定类型的模板目录路径
 * @param type 模板类型
 * @returns 模板目录绝对路径
 */
export function getTemplatePath(type: TemplateType): string {
  const baseDir = getTemplatesBaseDir();
  return path.join(baseDir, type);
}

/**
 * 检查模板是否存在
 * @param type 模板类型
 * @returns 是否存在
 */
export function hasTemplate(type: TemplateType): boolean {
  const templatePath = getTemplatePath(type);
  return fs.existsSync(templatePath);
}

/**
 * 获取所有可用模板
 * @returns 模板列表
 */
export function getAvailableTemplates(): Template[] {
  const templates: Template[] = [];

  for (const type of TEMPLATE_DIRS) {
    if (hasTemplate(type)) {
      templates.push({
        type,
        name: TEMPLATE_INFO[type].name,
        description: TEMPLATE_INFO[type].description,
        path: getTemplatePath(type),
      });
    }
  }

  return templates;
}

/**
 * 复制模板目录到目标位置
 * @param type 模板类型
 * @param targetPath 目标路径
 * @param options 可选参数
 */
export async function copyTemplate(
  type: TemplateType,
  targetPath: string,
  options: {
    projectName?: string;
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedFileName?: string;
  } = {}
): Promise<void> {
  if (!hasTemplate(type)) {
    throw new Error(`模板不存在: ${type}`);
  }

  const templatePath = getTemplatePath(type);

  // 复制模板目录，排除编译产物（.js、.d.ts、.map）
  await fs.copy(templatePath, targetPath, {
    overwrite: false,
    errorOnExist: true,
    filter: (src: string) => {
      // 排除编译产物
      if (src.endsWith('.js')) return false;
      if (src.endsWith('.d.ts')) return false;
      if (src.endsWith('.js.map')) return false;
      if (src.endsWith('.d.ts.map')) return false;
      return true;
    },
  });

  // 根据模板类型进行后处理
  if (type === 'service') {
    await processServiceTemplate(targetPath, options);
  } else if (type === 'microservice') {
    await processMicroserviceTemplate(targetPath, options);
  }
}

/**
 * 处理服务模板
 */
async function processServiceTemplate(
  targetPath: string,
  options: {
    projectName?: string;
  }
): Promise<void> {
  if (options.projectName) {
    // 更新 package.json
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = options.projectName;
      packageJson.description = `Main service ${options.projectName}`;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    // 更新 module.config.json
    const moduleConfigPath = path.join(targetPath, 'module.config.json');
    if (fs.existsSync(moduleConfigPath)) {
      const moduleConfig = await fs.readJson(moduleConfigPath);
      moduleConfig.name = options.projectName;
      moduleConfig.description = `Main service ${options.projectName}`;
      await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
    }

    // 更新源文件中的项目名称
    await updateFileContent(path.join(targetPath, 'src', 'main.ts'), options.projectName);
  }
}

/**
 * 处理微服务模板
 */
async function processMicroserviceTemplate(
  targetPath: string,
  options: {
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedFileName?: string;
  }
): Promise<void> {
  if (!options.moduleName) {
    return;
  }

  const { moduleName, normalizedClassName, normalizedFileName } = options;
  const normalizedCamelCase = options.normalizedCamelCase;
  if (normalizedCamelCase) {
    // Variable is reserved for future use in template files
  }

  // 更新 package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = moduleName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // 更新 module.config.json
  const moduleConfigPath = path.join(targetPath, 'module.config.json');
  if (fs.existsSync(moduleConfigPath)) {
    const moduleConfig = await fs.readJson(moduleConfigPath);
    moduleConfig.name = moduleName;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  // 重命名并更新源文件
  if (normalizedFileName && normalizedClassName) {
    const srcDir = path.join(targetPath, 'src');

    // 重命名模块文件
    const oldModulePath = path.join(srcDir, 'module.ts');
    const newModulePath = path.join(srcDir, `${normalizedFileName}.module.ts`);
    if (fs.existsSync(oldModulePath)) {
      await fs.rename(oldModulePath, newModulePath);
    }

    // 重命名控制器文件
    const oldControllerPath = path.join(srcDir, 'controller.ts');
    const newControllerPath = path.join(srcDir, `${normalizedFileName}.controller.ts`);
    if (fs.existsSync(oldControllerPath)) {
      await fs.rename(oldControllerPath, newControllerPath);
    }

    // 重命名服务文件
    const oldServicePath = path.join(srcDir, 'service.ts');
    const newServicePath = path.join(srcDir, `${normalizedFileName}.service.ts`);
    if (fs.existsSync(oldServicePath)) {
      await fs.rename(oldServicePath, newServicePath);
    }

    // 重命名 main.ts（如果需要）
    // main.ts 通常不需要重命名

    // 更新文件内容中的类名
    if (fs.existsSync(newModulePath)) {
      await updateFileContent(newModulePath, normalizedClassName);
    }
    if (fs.existsSync(newControllerPath)) {
      await updateFileContent(newControllerPath, normalizedClassName);
    }
    if (fs.existsSync(newServicePath)) {
      await updateFileContent(newServicePath, normalizedClassName);
    }

    // 更新 main.ts
    const mainPath = path.join(srcDir, 'main.ts');
    if (fs.existsSync(mainPath)) {
      await updateMicroserviceMain(mainPath, moduleName, normalizedClassName, normalizedFileName);
    }
  }
}

/**
 * 更新文件内容
 */

async function updateFileContent(filePath: string, _projectName: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');

  // 替换项目名称占位符（如果模板使用了占位符）
  // 这里可以根据实际需要添加更多替换逻辑

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 更新微服务 main.ts
 */
async function updateMicroserviceMain(
  filePath: string,
  moduleName: string,
  normalizedClassName: string,
  normalizedFileName: string
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = await fs.readFile(filePath, 'utf-8');

  // 替换导入语句
  content = content.replace(
    /from '\.\/\.?\/module\.module'/g,
    `from './${normalizedFileName}.module'`
  );

  // 替换模块类名
  content = content.replace(/AppModule/g, `${normalizedClassName}Module`);

  // 替换日志中的项目名称
  content = content.replace(/服务已启动/g, `${moduleName} 服务已启动`);

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 创建服务项目结构（兼容旧接口）
 */
export async function createProjectStructure(
  projectPath: string,
  projectName: string
): Promise<void> {
  await copyTemplate('service', projectPath, { projectName });
}

/**
 * 生成微服务模块文件（兼容旧接口）
 */
export async function generateMicroserviceFiles(
  targetDir: string,
  moduleName: string,
  normalizedClassName: string,
  normalizedCamelCase: string,
  normalizedFileName: string
): Promise<void> {
  await copyTemplate('microservice', targetDir, {
    moduleName,
    normalizedClassName,
    normalizedCamelCase,
    normalizedFileName,
  });
}
