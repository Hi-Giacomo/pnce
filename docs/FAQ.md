# PNCE CLI 常见问题解答 (FAQ)

本文档回答了 PNCE CLI 使用过程中的常见问题。

## 安装和配置

### Q1: 安装后提示找不到命令？

**A:** 确保全局安装路径在系统的 PATH 环境变量中。

检查 npm 全局路径：

```bash
npm config get prefix
```

将输出的路径（如 `/usr/local`）添加到 PATH。

### Q2: 如何卸载 PNCE CLI？

**A:** 运行以下命令：

```bash
npm uninstall -g pnce
# 或
yarn global remove pnce
```

### Q3: 如何升级到最新版本？

**A:** 运行以下命令：

```bash
npm update -g pnce
# 或
yarn global upgrade pnce
```

## 认证和登录

### Q4: 登录时浏览器没有打开？

**A:** 尝试以下方法：

1. 检查是否已安装浏览器
2. 手动访问授权页面，复制回调地址
3. 使用 `--port` 参数指定其他端口：

```bash
pnce login --port 8080
```

### Q5: Token 过期了怎么办？

**A:** Token 有效期通常是 24 小时。过期后需要重新登录：

```bash
pnce login
```

### Q6: 如何在 CI/CD 环境中使用？

**A:** 使用环境变量设置 Token：

```bash
export PNCE_TOKEN=your_token_here
pnce install <module>
```

或在配置文件中设置 Token。

## 模块管理

### Q7: 如何查看已安装的模块？

**A:** 运行以下命令：

```bash
pnce list
```

### Q8: 如何指定安装特定版本的模块？

**A:** 使用 `@` 符号指定版本：

```bash
pnce install module-name@1.0.0
pnce install module-name@latest
```

### Q9: 如何卸载已安装的模块？

**A:** 手动删除模块目录即可：

```bash
rm -rf ./modules/module-name
```

### Q10: 如何发布私有模块？

**A:** 确保已登录，然后运行：

```bash
pnce upload
```

私有模块通常需要相应的权限。

### Q11: 上传模块时提示权限错误？

**A:** 检查以下几点：

1. 是否已登录：`pnce login`
2. 是否有上传权限
3. `module.config.json` 配置是否正确

### Q12: 如何锁定模块版本？

**A:** 使用版本锁定功能：

```bash
pnce lock module-name@1.0.0
```

这将创建版本锁定文件，确保团队使用相同的版本。

## 配置

### Q13: 配置文件的优先级是什么？

**A:** 优先级从高到低：

1. 环境变量
2. 项目配置 (`./.pnce/config.json`)
3. 用户配置 (`~/.pnce/config.json`)
4. 默认配置

### Q14: 如何切换不同的配置环境？

**A:** 使用配置档案功能：

```bash
# 保存当前配置为档案
pnce profile save prod

# 切换到指定档案
pnce profile use prod

# 列出所有档案
pnce profile list
```

### Q15: 如何配置代理？

**A:** 在配置文件中设置：

```json
{
  "useProxy": true,
  "proxyUrl": "http://127.0.0.1:7890"
}
```

或使用环境变量：

```bash
export PNCE_PROXY_URL=http://127.0.0.1:7890
```

### Q16: 日志级别有哪些？

**A:** 支持以下日志级别：

- `error`: 只显示错误
- `warn`: 显示警告和错误
- `info`: 显示一般信息（默认）
- `debug`: 显示调试信息

设置方法：

```bash
export PNCE_LOG_LEVEL=debug
# 或在配置文件中设置
```

## 性能和缓存

### Q17: 如何清理缓存？

**A:** 运行以下命令：

```bash
pnce cache clean
```

### Q18: 如何禁用缓存？

**A:** 使用环境变量：

```bash
export PNCE_NO_CACHE=true
```

或在配置文件中设置：

```json
{
  "enableCache": false
}
```

### Q19: 上传/下载速度慢怎么办？

**A:** 尝试以下方法：

1. 检查网络连接
2. 配置代理（如适用）
3. 调整超时时间（在配置文件中设置 `downloadTimeout` 和 `uploadTimeout`）

## 错误排查

### Q20: 提示 "网络错误" 怎么办？

**A:** 检查：

1. 网络连接是否正常
2. 服务器地址是否正确
3. 代理配置是否正确
4. 防火墙是否阻止连接

### Q21: 提示 "模块不存在" 怎么办？

**A:** 确认：

1. 模块名称拼写正确
2. 已登录到正确的注册中心
3. 模块确实已发布到注册中心

使用搜索命令确认：

```bash
pnce search module-name
```

### Q22: 如何查看详细的错误信息？

**A:** 使用 `--verbose` 选项：

```bash
pnce install module-name --verbose
```

或设置日志级别为 debug：

```bash
export PNCE_LOG_LEVEL=debug
```

## 高级功能

### Q23: 如何离线使用？

**A:** 离线模式需要：

1. 提前安装所需模块并启用缓存
2. 使用缓存中的模块进行开发

PNCE CLI 会自动使用缓存的模块。

### Q24: 如何批量安装多个模块？

**A:** 创建一个依赖清单文件，然后逐个安装：

```bash
for module in module1 module2 module3; do
  pnce install $module
done
```

### Q25: 如何自定义模块安装路径？

**A:** 使用 `-d` 选项：

```bash
pnce install module-name -d /custom/path
```

或在配置文件中设置 `outputDir`。

## 开发和调试

### Q26: 如何启用调试模式？

**A:** 设置日志级别为 debug：

```bash
export PNCE_LOG_LEVEL=debug
```

### Q27: 如何查看日志文件？

**A:** 日志文件位置：

```
~/.pnce/logs/
```

按日期分类保存。

### Q28: 如何报告 Bug？

**A:** 访问 [GitHub Issues](https://github.com/hi-giacomo/pnce/issues) 提交问题报告，请包含：

- PNCE CLI 版本
- Node.js 版本
- 操作系统
- 错误信息
- 复现步骤

## 其他

### Q29: PNCE CLI 支持哪些操作系统？

**A:** 支持：

- macOS (Darwin)
- Linux
- Windows

### Q30: 最低 Node.js 版本要求是什么？

**A:** 要求 Node.js >= 18.0.0

### Q31: 如何获取更多帮助？

**A:**

- 查看文档: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)
- 提交 Issue: [https://github.com/hi-giacomo/pnce/issues](https://github.com/hi-giacomo/pnce/issues)
- 查看源代码: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)

---

还有其他问题？欢迎提交 Issue 或参与讨论！
