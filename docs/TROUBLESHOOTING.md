# PNCE CLI 故障排查指南

本文档提供常见问题的故障排查步骤和解决方案。

## 目录

1. [安装问题](#安装问题)
2. [认证问题](#认证问题)
3. [网络连接问题](#网络连接问题)
4. [模块管理问题](#模块管理问题)
5. [配置问题](#配置问题)
6. [性能问题](#性能问题)
7. [其他问题](#其他问题)

---

## 安装问题

### 问题：安装后命令未找到

**症状：**
```bash
$ pnce --version
zsh: command not found: pnce
```

**排查步骤：**

1. 检查是否全局安装成功：

```bash
npm list -g pnce
# 或
yarn global list | grep pnce
```

2. 检查 npm 全局路径：

```bash
npm config get prefix
# 输出如：/usr/local
```

3. 确保全局路径在 PATH 中：

```bash
echo $PATH | grep -o "/usr/local"
```

**解决方案：**

将 npm 全局路径添加到 PATH：

**Bash (`~/.bashrc`):**
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

**Zsh (`~/.zshrc`):**
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

执行后重新加载配置：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 问题：安装失败，提示权限不足

**症状：**
```bash
npm install -g pnce
npm ERR! code EACCES
npm ERR! errno -13
npm ERR! Error: EACCES: permission denied
```

**解决方案：**

**方案1：使用 sudo（不推荐）**
```bash
sudo npm install -g pnce
```

**方案2：配置 npm 权限（推荐）**
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pnce
```

**方案3：使用 nvm 管理 Node.js（最佳）**
```bash
nvm install node
nvm use node
npm install -g pnce
```

---

## 认证问题

### 问题：登录时浏览器未打开

**排查步骤：**

1. 检查默认浏览器是否安装：

```bash
# macOS
which open
# Linux
which xdg-open
# Windows
where start
```

2. 检查端口是否被占用：

```bash
# macOS/Linux
lsof -i :3001
# Windows
netstat -ano | findstr :3001
```

**解决方案：**

1. 指定其他端口：

```bash
pnce login --port 8080
```

2. 手动打开授权链接：

```bash
pnce login --print-url
# 复制输出中的 URL 在浏览器中打开
```

### 问题：登录成功但命令仍提示未登录

**排查步骤：**

1. 检查配置文件是否存在：

```bash
cat ~/.pnce/config.json
```

2. 检查 Token 字段：

```bash
cat ~/.pnce/config.json | grep token
```

**解决方案：**

1. 重新登录：

```bash
pnce logout
pnce login
```

2. 清除配置重新登录：

```bash
rm -rf ~/.pnce
pnce login
```

### 问题：Token 提前过期

**症状：** 即使刚登录，也提示 Token 过期

**排查步骤：**

1. 检查系统时间是否正确：

```bash
date
```

2. 检查 Token 过期时间：

```bash
cat ~/.pnce/config.json | grep tokenExpiresAt
```

**解决方案：**

1. 校准系统时间
2. 重新登录

---

## 网络连接问题

### 问题：提示网络错误或连接超时

**症状：**
```
Error: Network Error
Error: timeout of 30000ms exceeded
```

**排查步骤：**

1. 检查网络连接：

```bash
ping pnce.example.com
```

2. 检查服务器地址配置：

```bash
pnce config
```

3. 测试端口连通性：

```bash
# macOS/Linux
nc -zv pnce.example.com 3000
# Windows
telnet pnce.example.com 3000
```

**解决方案：**

1. 检查并修改服务器地址：

```bash
pnce init
# 在向导中输入正确的服务器地址
```

2. 配置代理：

```json
// ~/.pnce/config.json
{
  "useProxy": true,
  "proxyUrl": "http://127.0.0.1:7890"
}
```

3. 增加超时时间：

```json
{
  "downloadTimeout": 600000,
  "uploadTimeout": 1200000
}
```

### 问题：SSL 证书错误

**症状：**
```
Error: self signed certificate
Error: unable to verify the first certificate
```

**解决方案：**

1. 配置 CA 证书（仅限可信环境）：

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

2. 或指定证书文件：

```bash
export NODE_EXTRA_CA_CERTS=/path/to/ca.pem
```

---

## 模块管理问题

### 问题：模块安装失败

**排查步骤：**

1. 检查模块名称是否正确：

```bash
pnce search module-name
```

2. 检查登录状态：

```bash
pnce whoami
```

3. 启用详细日志：

```bash
export PNCE_LOG_LEVEL=debug
pnce install module-name
```

4. 检查磁盘空间：

```bash
df -h
```

5. 检查目标目录权限：

```bash
ls -la ./modules
```

**解决方案：**

1. 重新登录
2. 检查并修正模块名称
3. 检查磁盘空间
4. 检查目标目录权限
5. 使用 `--verbose` 获取详细错误

### 问题：模块下载速度慢

**排查步骤：**

1. 测试网络速度：

```bash
curl -o /dev/null http://pnce.example.com/test
```

2. 检查并发设置：

```bash
cat ~/.pnce/config.json | grep maxConcurrentDownloads
```

**解决方案：**

1. 配置代理
2. 调整并发下载数量：

```json
{
  "maxConcurrentDownloads": 5
}
```

3. 使用离线缓存（如果已下载过）

### 问题：上传模块失败

**排查步骤：**

1. 检查 `module.config.json` 是否存在且有效：

```bash
cat module.config.json
```

2. 检查模块目录结构：

```bash
ls -la
```

3. 检查模块大小：

```bash
du -sh .
```

**解决方案：**

1. 确保 `module.config.json` 存在且格式正确
2. 检查模块大小是否超过限制
3. 检查上传超时设置

---

## 配置问题

### 问题：配置文件未生效

**排查步骤：**

1. 检查配置文件路径：

```bash
echo ~/.pnce/config.json
cat ~/.pnce/config.json
```

2. 检查 JSON 格式是否正确：

```bash
python3 -m json.tool ~/.pnce/config.json
# 或
jq . ~/.pnce/config.json
```

3. 检查环境变量：

```bash
env | grep PNCE
```

**解决方案：**

1. 验证 JSON 格式
2. 检查环境变量是否覆盖了配置
3. 使用 `pnce config` 查看实际使用的配置

### 问题：配置文件损坏

**症状：**
```bash
pnce config
Error: Unexpected token ...
```

**解决方案：**

1. 删除配置文件：

```bash
rm ~/.pnce/config.json
```

2. 重新运行配置向导：

```bash
pnce init
```

---

## 性能问题

### 问题：CLI 响应慢

**排查步骤：**

1. 检查系统资源使用：

```bash
top  # 或 htop
```

2. 查看详细日志：

```bash
export PNCE_LOG_LEVEL=debug
pnce <command> --verbose
```

**解决方案：**

1. 关闭不必要的缓存：

```bash
export PNCE_NO_CACHE=true
```

2. 清理缓存：

```bash
pnce cache clean
```

3. 调整日志级别为 `warn` 或 `error`

---

## 其他问题

### 问题：日志文件过大

**排查步骤：**

1. 检查日志目录：

```bash
du -sh ~/.pnce/logs/
```

**解决方案：**

1. 删除旧日志：

```bash
find ~/.pnce/logs/ -name "*.log" -mtime +7 -delete
```

2. 配置日志级别减少输出

### 问题：无法卸载

**排查步骤：**

1. 检查全局安装路径：

```bash
npm config get prefix
```

**解决方案：**

手动删除相关文件：

```bash
rm -rf $(npm config get prefix)/bin/pnce
rm -rf $(npm config get prefix)/lib/node_modules/pnce
```

---

## 获取更多帮助

如果以上解决方案都无法解决问题，请：

1. 收集以下信息：
   - PNCE CLI 版本：`pnce --version`
   - Node.js 版本：`node --version`
   - 操作系统：`uname -a`
   - 错误信息（使用 `--verbose`）

2. 在 [GitHub Issues](https://github.com/hi-giacomo/pnce/issues) 提交问题报告

3. 查看日志文件：
   ```
   ~/.pnce/logs/
   ```

---

## 相关资源

- [快速开始指南](./QUICKSTART.md)
- [常见问题解答](./FAQ.md)
- [API 文档](./API_DOCUMENTATION.md)
- [贡献指南](./CONTRIBUTING.md)
