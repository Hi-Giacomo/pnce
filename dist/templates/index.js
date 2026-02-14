"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplatePath = getTemplatePath;
exports.hasTemplate = hasTemplate;
exports.getAvailableTemplates = getAvailableTemplates;
exports.copyTemplate = copyTemplate;
exports.createProjectStructure = createProjectStructure;
exports.generateMicroserviceFiles = generateMicroserviceFiles;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
/**
 * 模板目录列表
 */
const TEMPLATE_DIRS = ['service', 'microservice'];
/**
 * 模板描述信息
 */
const TEMPLATE_INFO = {
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
function getTemplatesBaseDir() {
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
function getTemplatePath(type) {
    const baseDir = getTemplatesBaseDir();
    return path.join(baseDir, type);
}
/**
 * 检查模板是否存在
 * @param type 模板类型
 * @returns 是否存在
 */
function hasTemplate(type) {
    const templatePath = getTemplatePath(type);
    return fs.existsSync(templatePath);
}
/**
 * 获取所有可用模板
 * @returns 模板列表
 */
function getAvailableTemplates() {
    const templates = [];
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
async function copyTemplate(type, targetPath, options = {}) {
    if (!hasTemplate(type)) {
        throw new Error(`模板不存在: ${type}`);
    }
    const templatePath = getTemplatePath(type);
    // 复制模板目录，排除编译产物（.js、.d.ts、.map）
    await fs.copy(templatePath, targetPath, {
        overwrite: false,
        errorOnExist: true,
        filter: (src) => {
            // 排除编译产物
            if (src.endsWith('.js'))
                return false;
            if (src.endsWith('.d.ts'))
                return false;
            if (src.endsWith('.js.map'))
                return false;
            if (src.endsWith('.d.ts.map'))
                return false;
            return true;
        },
    });
    // 根据模板类型进行后处理
    if (type === 'service') {
        await processServiceTemplate(targetPath, options);
    }
    else if (type === 'microservice') {
        await processMicroserviceTemplate(targetPath, options);
    }
}
/**
 * 处理服务模板
 */
async function processServiceTemplate(targetPath, options) {
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
async function processMicroserviceTemplate(targetPath, options) {
    if (!options.moduleName) {
        return;
    }
    const { moduleName, normalizedClassName, normalizedCamelCase, normalizedFileName, } = options;
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
async function updateFileContent(filePath, projectName) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = await fs.readFile(filePath, 'utf-8');
    // 替换项目名称占位符（如果模板使用了占位符）
    // 这里可以根据实际需要添加更多替换逻辑
    await fs.writeFile(filePath, content, 'utf-8');
}
/**
 * 更新微服务 main.ts
 */
async function updateMicroserviceMain(filePath, moduleName, normalizedClassName, normalizedFileName) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = await fs.readFile(filePath, 'utf-8');
    // 替换导入语句
    content = content.replace(/from '\.\/\.?\/module\.module'/g, `from './${normalizedFileName}.module'`);
    // 替换模块类名
    content = content.replace(/AppModule/g, `${normalizedClassName}Module`);
    // 替换日志中的项目名称
    content = content.replace(/服务已启动/g, `${moduleName} 服务已启动`);
    await fs.writeFile(filePath, content, 'utf-8');
}
/**
 * 创建服务项目结构（兼容旧接口）
 */
async function createProjectStructure(projectPath, projectName) {
    await copyTemplate('service', projectPath, { projectName });
}
/**
 * 生成微服务模块文件（兼容旧接口）
 */
async function generateMicroserviceFiles(targetDir, moduleName, normalizedClassName, normalizedCamelCase, normalizedFileName) {
    await copyTemplate('microservice', targetDir, {
        moduleName,
        normalizedClassName,
        normalizedCamelCase,
        normalizedFileName,
    });
}
//# sourceMappingURL=index.js.map