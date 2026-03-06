# PNCE CLI 快速开始指南

欢迎使用 PNCE CLI！本指南将帮助您快速上手使用 PNCE CLI 工具。

## 安装

### 使用 npm 安装

```bash
npm install -g pnce
```

### 使用 yarn 安装

```bash
yarn global add pnce
```

### 验证安装

```bash
pnce --version
```

## 基本使用

### 1. 登录认证

首次使用前，需要登录到 PNCE 注册中心：

```bash
pnce login
```

浏览器将自动打开授权页面，完成登录后即可使用。

### 2. 查看帮助

查看所有可用命令：

```bash
pnce --help
```

查看特定命令的帮助：

```bash
pnce upload --help
```

### 3. 上传模块

上传当前目录的模块到注册中心：

```bash
pnce upload
```

指定模块目录：

```bash
pnce upload -d /path/to/module
```

### 4. 安装模块

从注册中心安装模块：

```bash
pnce install <module-name>
```

指定版本安装：

```bash
pnce install <module-name>@1.0.0
```

安装到特定目录：

```bash
pnce install <module-name> -d ./modules
```

### 5. 管理模块

列出已安装的模块：

```bash
pnce list
```

查看模块详情：

```bash
pnce info <module-name>
```

搜索模块：

```bash
pnce search <keyword>
```

### 6. 退出登录

```bash
pnce logout
```

## 配置

### 使用交互式配置向导

```bash
pnce init
```

向导将引导您配置以下内容：
- 服务器地址
- 日志级别
- 代理设置

### 手动配置

配置文件位置：
- 用户配置: `~/.pnce/config.json`
- 项目配置: `./.pnce/config.json`

示例配置：

```json
{
  "apiServer": "https://pnce.example.com",
  "oauthEndpoint": "https://pnce.example.com/authorize",
  "oauthPort": 3001,
  "outputDir": "./modules",
  "logLevel": "info",
  "useProxy": false,
  "proxyUrl": "http://127.0.0.1:7890",
  "enableCache": true
}
```

## 自动补全

### Bash

```bash
echo "eval \"\$(pnce completion)\"" >> ~/.bashrc
source ~/.bashrc
```

### Zsh

```bash
echo "eval \"\$(pnce completion)\"" >> ~/.zshrc
source ~/.zshrc
```

### Fish

```bash
pnce completion > ~/.config/fish/completions/pnce.fish
```

## 常用场景

### 场景1：开发新模块

1. 创建模块目录并编写代码
2. 创建 `module.config.json` 配置文件
3. 运行 `pnce upload` 上传模块
4. 使用 `pnce install <module-name>` 测试安装

### 场景2：团队共享模块

1. 登录注册中心: `pnce login`
2. 安装团队模块: `pnce install team-module`
3. 团队成员可以同样安装使用

### 场景3：多环境配置

1. 创建配置档案: `pnce profile save prod`
2. 切换到生产配置: `pnce profile use prod`
3. 列出所有档案: `pnce profile list`

## 常见问题

### Q: 登录失败怎么办？

A: 检查网络连接，确保服务器地址正确。可以使用 `pnce config` 查看当前配置。

### Q: 如何更新 PNCE CLI？

A: 使用以下命令更新：

```bash
npm update -g pnce
# 或
yarn global upgrade pnce
```

### Q: 模块安装失败怎么办？

A: 检查：
1. 是否已登录: `pnce login`
2. 网络连接是否正常
3. 模块名称是否正确
4. 查看详细错误信息: `pnce install <module> --verbose`

## 下一步

- 阅读完整的 [API 文档](./API_DOCUMENTATION.md)
- 查看 [常见问题解答](./FAQ.md)
- 了解 [故障排查指南](./TROUBLESHOOTING.md)
- 查看 [贡献指南](./CONTRIBUTING.md)

## 获取帮助

- GitHub Issues: [https://github.com/hi-giacomo/pnce/issues](https://github.com/hi-giacomo/pnce/issues)
- 文档: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)

---

**祝您使用愉快！** 🚀
