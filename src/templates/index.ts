import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * TemplateType
 */
export type TemplateType = 'service' | 'microservice';

/**
 * TemplateInfoInterface
 */
export interface Template {
  type: TemplateType;
  name: string;
  description: string;
  path: string;
}

/**
 * TemplateDirectoryList
 */
const TEMPLATE_DIRS: TemplateType[] = ['service', 'microservice'];

/**
 * TemplateDescriptionInfo
 */
const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string }> = {
  service: {
    name: 'service',
    description: 'NestJSserviceProjectTemplate',
  },
  microservice: {
    name: 'service',
    description: 'NestJSservicemoduleTemplate',
  },
};

/**
 * TemplateDirectory
 */
function getTemplatesBaseDir(): string {
  //  src/templates， dist/templates
  const isDev = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'templates'));
  if (isDev) {
    return path.join(__dirname, '..', '..', 'src', 'templates');
  }
  return path.join(__dirname);
}

function getCliBaseDir(): string {
  const isDev = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'templates'));
  if (isDev) {
    return path.join(__dirname, '..', '..');
  }
  return path.join(__dirname, '..');
}

/**
 * TypeTemplateDirectory
 * @param type TemplateType
 * @returns TemplateDirectory
 */
export function getTemplatePath(type: TemplateType): string {
  const baseDir = getTemplatesBaseDir();
  return path.join(baseDir, type);
}

/**
 * TemplateYes/No
 * @param type TemplateType
 * @returns Yes/No
 */
export function hasTemplate(type: TemplateType): boolean {
  const templatePath = getTemplatePath(type);
  return fs.existsSync(templatePath);
}

/**
 * AllAvailableTemplate
 * @returns TemplateList
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
 * TemplateDirectory
 * @param type TemplateType
 * @param targetPath
 * @param options
 */
export async function copyTemplate(
  type: TemplateType,
  targetPath: string,
  options: {
    projectName?: string;
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedfileName?: string;
  } = {}
): Promise<void> {
  if (!hasTemplate(type)) {
    throw new Error(`Templatedoes not exist: ${type}`);
  }

  const templatePath = getTemplatePath(type);

  // TemplateDirectory，（.js、.d.ts、.map）
  await fs.copy(templatePath, targetPath, {
    overwrite: false,
    errorOnExist: true,
    filter: (src: string) => {
      //
      if (src.endsWith('.js')) return false;
      if (src.endsWith('.d.ts')) return false;
      if (src.endsWith('.js.map')) return false;
      if (src.endsWith('.d.ts.map')) return false;
      return true;
    },
  });

  // TemplateType
  if (type === 'service') {
    await processServiceTemplate(targetPath, options);
  } else if (type === 'microservice') {
    await processMicroserviceTemplate(targetPath, options);
  }
}

/**
 * Template
 */
async function processServiceTemplate(
  targetPath: string,
  options: {
    projectName?: string;
  }
): Promise<void> {
  if (options.projectName) {
    //  package.json
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = options.projectName;
      packageJson.description = `Main service ${options.projectName}`;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    //  module.config.json
    const moduleConfigPath = path.join(targetPath, 'module.config.json');
    if (fs.existsSync(moduleConfigPath)) {
      const moduleConfig = await fs.readJson(moduleConfigPath);
      moduleConfig.name = options.projectName;
      moduleConfig.description = `Main service ${options.projectName}`;
      await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
    }

    // fileProject name
    await updatefileContent(path.join(targetPath, 'src', 'main.ts'), options.projectName);
  }
}

/**
 * Template
 */
async function processMicroserviceTemplate(
  targetPath: string,
  options: {
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedfileName?: string;
  }
): Promise<void> {
  if (!options.moduleName) {
    return;
  }

  const { moduleName, normalizedClassName, normalizedfileName } = options;
  const normalizedCamelCase = options.normalizedCamelCase;
  if (normalizedCamelCase) {
    // Variable is reserved for future use in template files
  }

  //  package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = moduleName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  //  module.config.json
  const moduleConfigPath = path.join(targetPath, 'module.config.json');
  if (fs.existsSync(moduleConfigPath)) {
    const moduleConfig = await fs.readJson(moduleConfigPath);
    moduleConfig.name = moduleName;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  // file
  if (normalizedfileName && normalizedClassName) {
    const srcDir = path.join(targetPath, 'src');

    // modulefile
    const oldmodulePath = path.join(srcDir, 'module.ts');
    const newmodulePath = path.join(srcDir, `${normalizedfileName}.module.ts`);
    if (fs.existsSync(oldmodulePath)) {
      await fs.rename(oldmodulePath, newmodulePath);
    }

    // Controllerfile
    const oldControllerPath = path.join(srcDir, 'controller.ts');
    const newControllerPath = path.join(srcDir, `${normalizedfileName}.controller.ts`);
    if (fs.existsSync(oldControllerPath)) {
      await fs.rename(oldControllerPath, newControllerPath);
    }

    // file
    const oldServicePath = path.join(srcDir, 'service.ts');
    const newServicePath = path.join(srcDir, `${normalizedfileName}.service.ts`);
    if (fs.existsSync(oldServicePath)) {
      await fs.rename(oldServicePath, newServicePath);
    }

    //  main.ts（）
    // main.ts

    // file
    if (fs.existsSync(newmodulePath)) {
      await updatefileContent(newmodulePath, normalizedClassName);
    }
    if (fs.existsSync(newControllerPath)) {
      await updatefileContent(newControllerPath, normalizedClassName);
    }
    if (fs.existsSync(newServicePath)) {
      await updatefileContent(newServicePath, normalizedClassName);
    }

    //  main.ts
    const mainPath = path.join(srcDir, 'main.ts');
    if (fs.existsSync(mainPath)) {
      await updateMicroserviceMain(mainPath, moduleName, normalizedClassName, normalizedfileName);
    }
  }
}

/**
 * file
 */

async function updatefileContent(filePath: string, _projectName: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');

  // Project name（Template）
  //

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 *  main.ts
 */
async function updateMicroserviceMain(
  filePath: string,
  moduleName: string,
  normalizedClassName: string,
  normalizedfileName: string
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = await fs.readFile(filePath, 'utf-8');

  //
  content = content.replace(
    /from '\.\/\.?\/module\.module'/g,
    `from './${normalizedfileName}.module'`
  );

  // module
  content = content.replace(/Appmodule/g, `${normalizedClassName}module`);

  // Project name
  content = content.replace(/{{moduleName}}/g, `${moduleName} serviceStart`);

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * （Interface）
 */
export async function createProjectStructure(
  projectPath: string,
  projectName: string
): Promise<void> {
  await copyTemplate('service', projectPath, { projectName });
}

/**
 * modulefile（Interface）
 */
export async function generateMicroservicefiles(
  targetDir: string,
  moduleName: string,
  normalizedClassName: string,
  normalizedCamelCase: string,
  normalizedfileName: string
): Promise<void> {
  await copyTemplate('microservice', targetDir, {
    moduleName,
    normalizedClassName,
    normalizedCamelCase,
    normalizedfileName,
  });
}
