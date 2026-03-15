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
 * Validationmodule nameYes/No
 */
export function validateModuleName(name: string): { valid: boolean; error?: string } {
  // （ @scope/）
  const withoutScope = name.replace(/^@[^/]+\//, '');

  //
  const cleanName = withoutScope
    .replace(/\.\.\//g, '')
    .replace(/\.\//g, '')
    .replace(/[\/\\]/g, '');

  // Yes/No
  if (/^\d/.test(cleanName)) {
    return {
      valid: false,
      error: `module nameNumber: "${name}"\nPleaseUseName，: "module${cleanName}"  "my_${cleanName}"`,
    };
  }

  // Yes/NoYes
  if (/^\d+$/.test(cleanName.replace(/[-_\s]/g, ''))) {
    return {
      valid: false,
      error: `module namePackageNumber: "${name}"\nPlease，: "module_${cleanName}"  "version_${cleanName}"`,
    };
  }

  // Yes/No
  if (!cleanName || cleanName.trim() === '') {
    return {
      valid: false,
      error: 'module nameEmpty\nPleasevalidmodule name',
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
export function normalizeModuleName(name: string): string {
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
      // Yes/NoYes
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
  const pascalCase = normalizeModuleName(name);
  //
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * modulefile（kebab-case）
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

  // file：
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
