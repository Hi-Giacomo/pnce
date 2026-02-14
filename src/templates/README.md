# 模板系统

## 概述

模板系统使用 `src/templates` 目录中的模板文件夹，通过动态复制实现项目初始化。修改模板后，升级 CLI 工具即可直接使用新的模板。

## 目录结构

```
src/templates/
├── service/              # 服务模板目录
│   ├── src/             # 源代码
│   ├── document/        # 文档
│   ├── scripts/         # 脚本
│   ├── test/           # 测试
│   ├── logs/           # 日志
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── module.config.json
│   └── README.md
├── microservice/        # 微服务模板目录
│   ├── src/            # 源代码
│   │   ├── main.ts
│   │   ├── microservice.module.ts
│   │   ├── microservice.controller.ts
│   │   ├── microservice.service.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── module.config.json
└── index.ts            # 模板加载和导出
```

## 使用方式

### 1. 通过命令行（推荐）

```bash
# 创建服务项目
yarn cli init my-service --type service

# 创建微服务项目
yarn cli init my-micro --type microservice
```

### 2. 直接使用模板 API

```typescript
import { copyTemplate } from '../templates';

// 创建服务项目
await copyTemplate('service', '/path/to/project', {
  projectName: 'my-service'
});

// 创建微服务项目
await copyTemplate('microservice', '/path/to/project', {
  moduleName: 'my-micro',
  normalizedClassName: 'MyMicro',
  normalizedCamelCase: 'myMicro',
  normalizedFileName: 'my-micro'
});
```

### 3. 使用兼容接口

```typescript
import { createProjectStructure, generateMicroserviceFiles } from '../commands/templates';

// 创建服务项目
await createProjectStructure('/path/to/project', 'my-service');

// 创建微服务项目
generateMicroserviceFiles(
  '/path/to/project',
  'my-micro',
  'MyMicro',
  'myMicro',
  'my-micro'
);
```

## 修改模板

### 修改服务模板

1. 进入 `src/templates/service/` 目录
2. 修改任何文件或添加新文件
3. 重新编译 CLI 工具：`yarn build`
4. 使用新模板创建项目

### 修改微服务模板

1. 进入 `src/templates/microservice/` 目录
2. 修改任何文件或添加新文件
3. 重新编译 CLI 工具：`yarn build`
4. 使用新模板创建项目

## 添加新模板

### 步骤 1: 创建模板目录

```bash
mkdir src/templates/your-template
```

### 步骤 2: 创建模板文件

在目录中创建完整的项目结构，包括：
- 源代码文件
- 配置文件（package.json, tsconfig.json 等）
- README 文档

### 步骤 3: 注册模板

编辑 `src/templates/index.ts`，在 `TEMPLATE_DIRS` 中添加：

```typescript
const TEMPLATE_DIRS: TemplateType[] = ['service', 'microservice', 'your-template'];
```

在 `TEMPLATE_INFO` 中添加描述：

```typescript
const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string }> = {
  service: { name: '主服务', description: 'NestJS主服务项目模板' },
  microservice: { name: '微服务', description: 'NestJS微服务模块模板' },
  'your-template': { name: '你的模板', description: '你的模板描述' },
};
```

### 步骤 4: 实现后处理逻辑

如果需要对模板文件进行特殊处理，在 `index.ts` 中添加相应的处理函数：

```typescript
async function processYourTemplate(
  targetPath: string,
  options: { ... }
): Promise<void> {
  // 实现你的模板处理逻辑
}
```

## 模板变量替换

### 微服务模板

微服务模板创建时会自动进行以下替换：

1. **文件重命名**：
   - `microservice.module.ts` → `{normalizedFileName}.module.ts`
   - `microservice.controller.ts` → `{normalizedFileName}.controller.ts`
   - `microservice.service.ts` → `{normalizedFileName}.service.ts`

2. **类名替换**：
   - `MicroserviceModule` → `{normalizedClassName}Module`
   - `MicroserviceController` → `{normalizedClassName}Controller`
   - `MicroserviceService` → `{normalizedClassName}Service`

3. **导入语句更新**：
   - `main.ts` 中的模块导入会自动更新

4. **配置文件更新**：
   - `package.json` 中的 name 字段
   - `module.config.json` 中的 name 字段

### 服务模板

服务模板创建时会进行以下替换：

1. **配置文件更新**：
   - `package.json` 中的 name 和 description 字段
   - `module.config.json` 中的 name 和 description 字段

## 模板规范

### 文件命名规范

- 使用 kebab-case: `microservice.module.ts`
- 类名使用 PascalCase: `MicroserviceModule`
- 服务名使用 camelCase: `microserviceService`

### 模板占位符

如果模板需要使用占位符，建议使用以下格式：
- `{{PROJECT_NAME}}`: 项目名称
- `{{MODULE_NAME}}`: 模块名称
- `{{CLASS_NAME}}`: 类名
- `{{FILE_NAME}}`: 文件名

（当前版本尚未实现占位符系统，但计划在未来支持）

## API 参考

### copyTemplate()

复制模板目录到目标位置。

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

**参数：**
- `type`: 模板类型 ('service' | 'microservice')
- `targetPath`: 目标路径
- `options`: 可选参数
  - `projectName`: 项目名称（服务模板）
  - `moduleName`: 模块名称（微服务模板）
  - `normalizedClassName`: 规范化的类名
  - `normalizedCamelCase`: 规范化的驼峰命名
  - `normalizedFileName`: 规范化的文件名

**示例：**
```typescript
await copyTemplate('service', '/tmp/my-service', {
  projectName: 'my-service'
});
```

### getTemplatePath()

获取模板目录的绝对路径。

```typescript
function getTemplatePath(type: TemplateType): string
```

### hasTemplate()

检查模板是否存在。

```typescript
function hasTemplate(type: TemplateType): boolean
```

### getAvailableTemplates()

获取所有可用模板的列表。

```typescript
function getAvailableTemplates(): Template[]
```

## 最佳实践

1. **模板简洁**: 保持模板简洁，只包含必要文件
2. **版本控制**: 模板变更应有版本记录
3. **测试充分**: 修改模板后充分测试
4. **文档完善**: 修改模板时更新文档
5. **命名一致**: 保持命名风格一致

## 常见问题

### Q: 修改模板后需要重新编译吗？

A: 是的，需要运行 `yarn build` 重新编译 CLI 工具。

### Q: 如何更新已创建的项目？

A: 模板只影响新创建的项目，已创建的项目需要手动更新。

### Q: 可以使用占位符吗？

A: 当前版本使用硬编码的替换逻辑，计划在未来支持占位符系统。

### Q: 如何调试模板问题？

A: 可以在 `index.ts` 的处理函数中添加 `console.log` 进行调试。

## 相关文件

- `src/commands/templates/index.ts`: 命令层适配器
- `src/commands/init.commands.ts`: 初始化命令
- `tsconfig.json`: TypeScript 配置（已排除模板目录）

## 维护建议

1. 定期审查模板代码，保持与依赖包最新版本同步
2. 根据用户反馈优化模板
3. 添加更多模板类型
4. 实现占位符系统
5. 添加模板验证功能
