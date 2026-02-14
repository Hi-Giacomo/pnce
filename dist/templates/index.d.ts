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
 * 获取指定类型的模板目录路径
 * @param type 模板类型
 * @returns 模板目录绝对路径
 */
export declare function getTemplatePath(type: TemplateType): string;
/**
 * 检查模板是否存在
 * @param type 模板类型
 * @returns 是否存在
 */
export declare function hasTemplate(type: TemplateType): boolean;
/**
 * 获取所有可用模板
 * @returns 模板列表
 */
export declare function getAvailableTemplates(): Template[];
/**
 * 复制模板目录到目标位置
 * @param type 模板类型
 * @param targetPath 目标路径
 * @param options 可选参数
 */
export declare function copyTemplate(type: TemplateType, targetPath: string, options?: {
    projectName?: string;
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedFileName?: string;
}): Promise<void>;
/**
 * 创建服务项目结构（兼容旧接口）
 */
export declare function createProjectStructure(projectPath: string, projectName: string): Promise<void>;
/**
 * 生成微服务模块文件（兼容旧接口）
 */
export declare function generateMicroserviceFiles(targetDir: string, moduleName: string, normalizedClassName: string, normalizedCamelCase: string, normalizedFileName: string): Promise<void>;
//# sourceMappingURL=index.d.ts.map