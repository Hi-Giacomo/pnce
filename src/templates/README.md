# Template System

## Overview

Template System使用 `src/templates` 目录中的模板文件夹，通过动态复制实现项目初始化。Modifying Templates后，升级 CLI 工具即可直接使用新的模板。

## Directory Structure

```
src/templates/
├── service/              # Service template directory
│   ├── src/             # Source code
│   ├── document/        # Documentation
│   ├── scripts/         # Scripts
│   ├── test/           # Tests
│   ├── logs/           # Logs
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── module.config.json
│   └── README.md
├── microservice/        # 微Service template directory
│   ├── src/            # Source code
│   │   ├── main.ts
│   │   ├── microservice.module.ts
│   │   ├── microservice.controller.ts
│   │   ├── microservice.service.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── module.config.json
└── index.ts            # Template loading and export
```

## Usage

### 1. Via Command Line (Recommended)

```bash
# Create service project
yarn cli init my-service --type service

# Create microservice project
yarn cli init my-micro --type microservice
```

### 2. Use template API directly

```typescript
import { copyTemplate } from '../templates';

// Create service project
await copyTemplate('service', '/path/to/project', {
  projectName: 'my-service'
});

// Create microservice project
await copyTemplate('microservice', '/path/to/project', {
  moduleName: 'my-micro',
  normalizedClassName: 'MyMicro',
  normalizedCamelCase: 'myMicro',
  normalizedFileName: 'my-micro'
});
```

### 3. Use compatible interface

```typescript
import { createProjectStructure, generateMicroserviceFiles } from '../commands/templates';

// Create service project
await createProjectStructure('/path/to/project', 'my-service');

// Create microservice project
generateMicroserviceFiles(
  '/path/to/project',
  'my-micro',
  'MyMicro',
  'myMicro',
  'my-micro'
);
```

## Modifying Templates

### Modify service template

1. Go to `src/templates/service/` directory
2. Modify any files or add new files
3. Recompile CLI tool: `yarn build`
4. Create project with new template

### Modify microservice template

1. Go to `src/templates/microservice/` directory
2. Modify any files or add new files
3. Recompile CLI tool: `yarn build`
4. Create project with new template

## Adding New Templates

### Step 1: Create template directory

```bash
mkdir src/templates/your-template
```

### Step 2: Create template files

Create complete project structure in directory, including:
- Source code文件
- Configuration files (package.json, tsconfig.json, etc.)
- README Documentation

### Step 3: Register template

Edit `src/templates/index.ts`, add in `TEMPLATE_DIRS`:

```typescript
const TEMPLATE_DIRS: TemplateType[] = ['service', 'microservice', 'your-template'];
```

Add description in `TEMPLATE_INFO`:

```typescript
const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string }> = {
  service: { name: '主服务', description: 'NestJS主服务项目模板' },
  microservice: { name: '微服务', description: 'NestJS微服务模块模板' },
  'your-template': { name: 'Your template', description: 'Your template描述' },
};
```

### Step 4: Implement post-processing logic

If special processing is needed for template files, add corresponding processing functions in `index.ts`:

```typescript
async function processYourTemplate(
  targetPath: string,
  options: { ... }
): Promise<void> {
  // 实现Your template处理逻辑
}
```

## Template Variable Replacement

### Microservice template

Microservice template创建时会自动进行以下替换：

1. **文件重命名**：
   - `microservice.module.ts` → `{normalizedFileName}.module.ts`
   - `microservice.controller.ts` → `{normalizedFileName}.controller.ts`
   - `microservice.service.ts` → `{normalizedFileName}.service.ts`

2. **Class name替换**：
   - `MicroserviceModule` → `{normalizedClassName}Module`
   - `MicroserviceController` → `{normalizedClassName}Controller`
   - `MicroserviceService` → `{normalizedClassName}Service`

3. **导入语句更新**：
   - `main.ts` 中的模块导入会自动更新

4. **配置文件更新**：
   - `package.json` in the name field
   - `module.config.json` in the name field

### 服务模板

Service template creation will perform the following replacements:

1. **配置文件更新**：
   - `package.json` name and description fields in
   - `module.config.json` name and description fields in

## Template Guidelines

### File naming conventions

- Use kebab-case: `microservice.module.ts`
- Class names use PascalCase: `MicroserviceModule`
- Service names use camelCase: `microserviceService`

### Template placeholders

If the template needs placeholders, the following format is recommended:
- `{{PROJECT_NAME}}`: Project name
- `{{MODULE_NAME}}`: Module name
- `{{CLASS_NAME}}`: Class name
- `{{FILE_NAME}}`: File name

(Current version has not implemented placeholder system, but planned for future support)

## API Reference

### copyTemplate()

Copy template directory to target location.

```typescript
async function copyTemplate(
  type: TemplateType,
  targetPath: string,
  options?: {
    projectName?: string;
    moduleName?: string;
    normalizedClassName?: string;
    normalizedCamelCase?: string;
    normalizedFileName?: string;
  }
): Promise<void>
```

**Parameters:**
- `type`: Template type ('service' | 'microservice')
- `targetPath`: Target path
- `options`: Optional parameters
  - `projectName`: Project name（服务模板）
  - `moduleName`: Module name（Microservice template）
  - `normalizedClassName`: 规范化的Class name
  - `normalizedCamelCase`: Normalized camel case
  - `normalizedFileName`: 规范化的File name

**示例：**
```typescript
await copyTemplate('service', '/tmp/my-service', {
  projectName: 'my-service'
});
```

### getTemplatePath()

Get absolute path of template directory.

```typescript
function getTemplatePath(type: TemplateType): string
```

### hasTemplate()

Check if template exists.

```typescript
function hasTemplate(type: TemplateType): boolean
```

### getAvailableTemplates()

Get list of all available templates.

```typescript
function getAvailableTemplates(): Template[]
```

## Best Practices

1. **Keep templates simple**: 保持Keep templates simple，只包含必要文件
2. **Version control**: Template changes should be versioned
3. **Tests充分**: Modifying Templates后充分Tests
4. **Documentation完善**: Modifying Templates时更新Documentation
5. **Consistent naming**: Keep naming style consistent

## FAQ

### Q: Modifying Templates后需要重新编译吗？

A: Yes, you need to run `yarn build` to recompile the CLI tool.

### Q: 如何更新已创建的项目？

A: Templates only affect newly created projects, already created projects need manual updates.

### Q: 可以使用占位符吗？

A: Current version uses hardcoded replacement logic, placeholder system is planned for future support.

### Q: 如何调试模板问题？

A: You can add `console.log` in the processing functions in `index.ts` for debugging.

## Related Files

- `src/commands/templates/index.ts`: Command layer adapter
- `src/commands/init.commands.ts`: Initialization command
- `tsconfig.json`: TypeScript configuration (template directory excluded)

## Maintenance Tips

1. Regularly review template code, keep in sync with latest dependency versions
2. Optimize templates based on user feedback
3. 添加更多Template type
4. Implement placeholder system
5. Add template validation functionality
