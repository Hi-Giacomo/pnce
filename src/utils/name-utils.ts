/**
 * module nameUtility
 */

/**
 * 
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validationmodule nameYesNo
 */
export function validatemoduleName(name: string): { valid: boolean; error?: string } {
  // （ @scope/）
  const withoutScope = name.replace(/^@[^/]+\//, '');

  // 
  const cleanName = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');

  // YesNo
  if (/^\d/.test(cleanName)) {
    return {
      valid: false,
      error: `module name不能以数字开头: "${name}"\n请使用字母开头的名称，例如: "module${cleanName}" 或 "my_${cleanName}"`,
    };
  }

  // YesNoYes
  if (/^\d+$/.test(cleanName.replace(/[-_\s]/g, ''))) {
    return {
      valid: false,
      error: `module name不能只包含数字: "${name}"\n请添加有意义的字母前缀，例如: "module_${cleanName}" 或 "version_${cleanName}"`,
    };
  }

  // YesNo
  if (!cleanName || cleanName.trim() === '') {
    return {
      valid: false,
      error: 'module name不能为空\n请提供有效的module name',
    };
  }

  return { valid: true };
}

/**
 * module name PascalCase 
 * @example demo_name_1 -> DemoName1
 * @example my-cool-module -> MyCoolmodule
 * @example test_demo -> TestDemo
 */
export function normalizemoduleName(name: string): string {
  // （ @scope/）
  const withoutScope = name.replace(/^@[^/]+\//, '');

  // 
  const cleaned = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');

  // （-、_、）
  // ，
  const words = cleaned.split(/[-_\s]+/).filter((word) => word.length > 0);

  const pascalCase = words
    .map((word) => {
      // YesNoYes
      if (/^\d+$/.test(word)) {
        return word; // 
      }
      // ：，
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  return pascalCase || 'Mymodule';
}

/**
 * module name camelCase 
 * @example demo_name_1 -> demoName1
 * @example my-cool-module -> myCoolmodule
 */
export function normalizeCamelCase(name: string): string {
  const pascalCase = normalizemoduleName(name);
  // 
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * moduleFile（kebab-case）
 * @example demo_name_1 -> demo-name-1
 * @example Demomodule -> demo-module
 */
export function normalizeFileName(name: string): string {
  // 
  const withoutScope = name.replace(/^@[^/]+\//, '');

  // 
  let cleaned = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');

  // ：
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1-$2');

  // File：
  // 1. 
  // 2. 
  // 3. 
  // 4. 
  const normalized = cleaned
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/[-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized || 'my-module';
}
