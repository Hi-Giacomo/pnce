/**
 * 模块名称处理工具函数
 */
/**
 * 首字母大写
 */
export declare function capitalize(str: string): string;
/**
 * 验证模块名称是否合法
 */
export declare function validateModuleName(name: string): {
    valid: boolean;
    error?: string;
};
/**
 * 将模块名称转换为 PascalCase 类名
 * @example demo_name_1 -> DemoName1
 * @example my-cool-module -> MyCoolModule
 * @example test_demo -> TestDemo
 */
export declare function normalizeModuleName(name: string): string;
/**
 * 将模块名称转换为 camelCase 变量名
 * @example demo_name_1 -> demoName1
 * @example my-cool-module -> myCoolModule
 */
export declare function normalizeCamelCase(name: string): string;
/**
 * 从模块名生成合法的文件名（kebab-case）
 * @example demo_name_1 -> demo-name-1
 * @example DemoModule -> demo-module
 */
export declare function normalizeFileName(name: string): string;
//# sourceMappingURL=name-utils.d.ts.map