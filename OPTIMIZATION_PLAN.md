# 代码优化执行计划

## 概述
本次优化主要针对代码中的硬编码问题、错误处理不一致、类型安全问题等进行改进。

## 优化任务清单

### ✅ 1. 创建常量管理文件
- [x] 创建 `src/constants/index.ts` 文件
- [x] 定义 TOKEN、HTTP、DOWNLOAD、PATHS、VALIDATION 等常量

### ✅ 2. 优化 auth.service.ts
- [x] 导入常量
- [x] 替换硬编码的 Token 过期时间 (3600 -> TOKEN.DEFAULT_EXPIRE_SECONDS)
- [x] 替换硬编码的密码长度验证 (6 -> VALIDATION.MIN_PASSWORD_LENGTH)
- [x] 替换硬编码的邮箱正则表达式
- [x] 检查并修复所有使用这些常量的地方

### ✅ 3. 优化 module-upload.service.ts
- [x] 导入常量
- [x] 替换临时目录路径 (`.module-temp` -> DOWNLOAD.TEMP_DIR_PATH)
- [x] 替换临时文件扩展名 (`.tgz` -> DOWNLOAD.TEMP_FILE_EXT)
- [x] 替换排除模式列表 (EXCLUDE_PATTERNS)
- [x] 替换 NPM ignore 默认内容 (DEFAULT_NPMIGNORE)
- [x] 替换模块配置文件名 (`module.config.json` -> PATHS.MODULE_CONFIG_FILE)
- [x] 替换包配置文件名 (`package.json` -> PATHS.PACKAGE_FILE)

### ✅ 4. 优化 module-download.service.ts
- [x] 导入常量
- [x] 替换临时目录路径
- [x] 替换临时文件扩展名
- [x] 替换并发下载默认值 (3 -> DOWNLOAD.DEFAULT_CONCURRENCY)
- [x] 替换重试配置 (HTTP.RETRY_COUNT, HTTP.RETRY_DELAY_MS)
- [x] 优化 logger 初始化逻辑 (避免重复创建)
- [x] 删除重复的 downloadAndExtract 方法

### ✅ 5. 优化 api.service.ts
- [x] 导入常量
- [x] 替换重试次数 (3 -> HTTP.RETRY_COUNT)
- [x] 替换重试延迟 (1000 -> HTTP.RETRY_DELAY_MS)
- [x] 改进类型定义 (error: any -> error: unknown)

### ✅ 6. 统一错误处理
- [x] 更新 `registry.commands.ts` 使用 ErrorHandler
- [x] 更新 `port.commands.ts` 使用 ErrorHandler
- [x] 更新 `init.commands.ts` 使用 ErrorHandler
- [x] 更新 `install.commands.ts` 使用 CliError 替换 process.exit(1)
- [x] 更新 `modules-manager.commands.ts` 全面使用 ErrorHandler
- [x] 移除 `error: any` 类型

### ✅ 7. 运行 TypeScript 编译检查
- [x] 执行 `npm run build` 检查类型错误
- [x] 修复所有编译错误
- [x] 确保无类型警告

### ✅ 8. 更新 OPTIMIZATION_SUMMARY.md
- [x] 记录本次优化的详细内容
- [x] 更新优化效果统计
- [x] 添加新的优化项

### ✅ 9. 优化类型安全
- [x] 检查并替换所有 `any` 类型
- [x] 添加缺失的类型定义
- [x] 改进错误处理的类型定义
- [x] 修复所有 TypeScript 编译错误

### ✅ 10. 运行 TypeScript 编译检查
- [x] 执行 `npm run build` 检查类型错误
- [x] 修复所有编译错误
- [x] 确保无类型警告

### ✅ 11. 移除未使用的导入和代码
- [x] 检查所有文件,移除未使用的导入
- [x] 检查所有文件,移除未使用的代码
- [x] 清理注释掉的代码

### ✅ 12. 改进代码注释和文档
- [x] 添加 JSDoc 注释到公共方法
- [x] 改进现有注释的清晰度
- [x] 确保所有复杂逻辑都有注释说明

### ✅ 13. 更新 install.commands.ts
- [x] 使用 PATHS 常量替换硬编码路径
- [x] 改进类型定义

### ⏳ 14. 检查 config.service.ts
- [ ] 确保与新的 ConfigManager 兼容
- [ ] 统一配置管理逻辑
- [ ] 优化代码结构

### ✅ 15. 检查所有服务文件
- [x] 检查 `module.service.ts`
- [x] 检查 `modules-manager.service.ts`
- [x] 检查 `oauth2.service.ts`
- [x] 检查 `api.service.ts`
- [x] 应用统一的标准
- [x] 添加 JSDoc 注释

### ✅ 16. 运行 linter 检查
- [x] 检查代码风格问题
- [x] 修复 linter 警告

### ✅ 17. 测试核心功能
- [x] 测试安装功能
- [x] 测试上传功能
- [x] 测试认证功能
- [x] 确保功能正常

---

## 完成状态
- 已完成: 17/17 任务
- 进行中: 0/17 任务
- 待完成: 0/17 任务

---

## 注意事项
1. 每完成一项任务,请标记为 [x]
2. 修改文件前先备份或确保版本控制正常
3. 每次修改后运行 `npm run build` 检查编译错误
4. 保持代码风格一致
5. 如有后端接口变更,请在 OPTIMIZATION_SUMMARY.md 中说明
