/**
 * 模块名称处理工具函数
 */

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 验证模块名称是否合法
 */
export function validateModuleName(name: string): { valid: boolean; error?: string } {
  // 移除作用域前缀（如 @scope/）
  const withoutScope = name.replace(/^@[^/]+\//, '');
  
  // 移除路径字符
  const cleanName = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');
  
  // 检查是否以数字开头
  if (/^\d/.test(cleanName)) {
    return {
      valid: false,
      error: `模块名称不能以数字开头: "${name}"\n请使用字母开头的名称，例如: "module${cleanName}" 或 "my_${cleanName}"`
    };
  }
  
  // 检查是否全部是数字
  if (/^\d+$/.test(cleanName.replace(/[-_\s]/g, ''))) {
    return {
      valid: false,
      error: `模块名称不能只包含数字: "${name}"\n请添加有意义的字母前缀，例如: "module_${cleanName}" 或 "version_${cleanName}"`
    };
  }
  
  // 检查是否为空
  if (!cleanName || cleanName.trim() === '') {
    return {
      valid: false,
      error: '模块名称不能为空\n请提供有效的模块名称'
    };
  }
  
  return { valid: true };
}

/**
 * 将模块名称转换为 PascalCase 类名
 * @example demo_name_1 -> DemoName1
 * @example my-cool-module -> MyCoolModule
 * @example test_demo -> TestDemo
 */
export function normalizeModuleName(name: string): string {
  // 移除作用域前缀（如 @scope/）
  const withoutScope = name.replace(/^@[^/]+\//, '');
  
  // 移除路径相关字符
  let cleaned = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');
  
  // 将字符串按分隔符（-、_、空格）拆分
  // 然后将每个单词首字母大写，其余小写
  const words = cleaned.split(/[-_\s]+/).filter(word => word.length > 0);
  
  const pascalCase = words
    .map(word => {
      // 检查单词是否全是数字
      if (/^\d+$/.test(word)) {
        return word; // 数字保持原样
      }
      // 字母开头：首字母大写，其余小写
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
  
  return pascalCase || 'MyModule';
}

/**
 * 将模块名称转换为 camelCase 变量名
 * @example demo_name_1 -> demoName1
 * @example my-cool-module -> myCoolModule
 */
export function normalizeCamelCase(name: string): string {
  const pascalCase = normalizeModuleName(name);
  // 将首字母转为小写
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * 从模块名生成合法的文件名（kebab-case）
 * @example demo_name_1 -> demo-name-1
 * @example DemoModule -> demo-module
 */
export function normalizeFileName(name: string): string {
  // 移除作用域前缀
  const withoutScope = name.replace(/^@[^/]+\//, '');
  
  // 移除路径相关字符
  let cleaned = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');
  
  // 处理驼峰命名：在小写字母后跟大写字母的位置插入连字符
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1-$2');
  
  // 标准化文件名：
  // 1. 将非字母数字字符替换为连字符
  // 2. 多个连字符合并为一个
  // 3. 去除首尾连字符
  // 4. 转换为小写
  let normalized = cleaned
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/[-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  
  return normalized || 'my-module';
}
