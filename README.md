# Pnce CLI

**Pnce CLI Tool** - NestJS 模块化快速开发命令行工具

专为 NestJS 设计的模块化开发工具，帮助开发者快速创建、管理、发布和部署 NestJS 服务与微服务模块。

## 📋 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [命令参考](#命令参考)
- [创建服务/微服务](#创建服务微服务)
- [发布模块](#发布模块)
- [安装模块](#安装模块)
- [依赖管理](#依赖管理)
- [部署到 Linux 服务器](#部署到-linux-服务器)
- [配置文件](#配置文件)
- [常见问题](#常见问题)

## 🚀 安装

### 全局安装

```bash
npm install -g pnce
```

安装后，可以在任何目录使用 `pnce` 命令。

### 验证安装

```bash
pnce --version
pnce --help
```

## 📖 快速开始

### 1. 登录账户

```bash
pnce login
```

在浏览器中完成 OAuth2 授权登录。也可使用邮箱密码登录：

```bash
pnce login -e your@email.com -p your-password
```

### 2. 创建项目

```bash
# 创建服务项目
pnce init my-service

# 创建微服务项目
pnce init my-microservice --type microservice

# 在指定目录创建
pnce init my-service --directory /path/to/project
```

### 3. 发布模块

```bash
# 在项目目录下
cd my-service
pnce publish
```

### 4. 安装模块

```bash
# 安装到当前项目（默认临时安装）
pnce install module-name@version

# 添加为外部依赖（存储在 src/external_modules，添加到 modules.json）
pnce install module-name --link

# 添加为本地集成（存储在 src/local_modules，添加到 package.json 的 localModules）
pnce install module-name --save
```

## 📦 命令参考

### 认证命令

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `register` | 注册新用户 | `pnce register -u username -e email -p password` |
| `login` | 登录账户（网页授权） | `pnce login` |
| `login` | 登录账户（邮箱密码） | `pnce login -e email -p password` |
| `logout` | 登出账户 | `pnce logout` |

### 项目管理

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `init [name]` | 创建服务项目 | `pnce init my-service` |
| `init [name] -t microservice` | 创建微服务项目 | `pnce init my-ms -t microservice` |

### 模块管理

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `publish` | 发布模块 | `pnce publish` |
| `publish -d <dir>` | 指定目录发布 | `pnce publish -d ./my-module` |
| `stats` | 查看统计信息 | `pnce stats` |

### 安装命令

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `install <module>` | 临时安装模块 | `pnce install module@1.0.0` |
| `install <module> --link` | 外部依赖模式（modules.json） | `pnce install module --link` |
| `install <module> --save` | 本地集成模式（package.json） | `pnce install module --save` |
| `install <module> -p <port>` | 指定端口 | `pnce install module -p 3000` |

### 模块集合管理

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `modules-init` | 初始化 modules.json | `pnce modules-init` |
| `modules-add <module> [version]` | 添加模块到 modules.json | `pnce modules-add auth ^1.0.0` |
| `modules-add --no-install` | 仅添加不安装 | `pnce modules-add auth ^1.0.0 --no-install` |
| `modules-remove <module>` | 从 modules.json 移除 | `pnce modules-remove auth` |
| `modules-install` | 安装所有依赖 | `pnce modules-install` |
| `modules-install --force` | 强制重新安装 | `pnce modules-install --force` |
| `modules-list` | 列出所有依赖 | `pnce modules-list` |
| `modules-prune` | 清理未使用的模块 | `pnce modules-prune` |

### 端口管理

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `ports` | 查看端口分配信息 | `pnce ports` |
| `ports -c` | 清除端口缓存 | `pnce ports -c` |
| `ports -s` | 显示端口分配信息 | `pnce ports -s` |

### 镜像源管理

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `registry set <url>` | 设置模块服务下载地址 | `pnce registry set https://registry.example.com` |
| `registry get` | 查看当前模块服务下载地址 | `pnce registry get` |
| `registry ping` | 验证模块服务连接 | `pnce registry ping` |
| `registry reset` | 重置为默认模块服务地址 | `pnce registry reset` |

### 导入路径修复

| 命令 | 说明 | 示例 |
| ----- | ---- | ---- |
| `fix-imports <module>` | 修正模块导入路径 | `pnce fix-imports module-name` |
| `fix-imports <module> -d <dir>` | 指定模块目录 | `pnce fix-imports module-name -d src/external_modules` |

## 🏗️ 创建服务/微服务

### 创建服务项目

```bash
# 创建服务（默认类型）
pnce init user-service
```

生成的项目结构：

```
user-service/
├── src/
│   ├── main.ts              # 应用入口
│   ├── app.module.ts        # 根模块
│   ├── app.controller.ts    # 控制器
│   └── app.service.ts      # 服务
├── nest-cli.json
├── tsconfig.json
├── package.json
└── module.config.json      # 模块配置
```

### 创建微服务项目

```bash
# 创建微服务
pnce init auth-microservice --type microservice
```

生成的项目结构：

```
app/
├── src/
│   ├── main.ts              # 微服务入口
│   ├── index.ts             # 微服务模块入口
│   ├── app.module.ts        # 根模块
│   ├── app.controller.ts    # 控制器
│   └── app.service.ts      # 服务
├── nest-cli.json
├── tsconfig.json
├── package.json
└── module.config.json      # 模块配置
```

### 本地开发

```bash
# 进入项目目录
cd my-service

# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建项目
npm run build

# 启动服务
npm run start
```

## 📤 发布模块

### 准备发布

1. **编辑 module.config.json**

```json
{
  "name": "user-service",
  "description": "用户管理微服务",
  "author": "your-name",
  "version": "1.0.0",
  "type": "microservice",
  "appId": "your-app-id",
  "teamId": "your-team-id"
}
```

2. **测试模块**

```bash
# 构建项目
npm run build

# 启动服务测试
npm run start

# 测试功能
curl http://localhost:3000
```

3. **发布模块**

```bash
# 在项目根目录执行
pnce publish

# 指定发布目录
pnce publish --directory ./my-module
```

发布流程：
1. 读取 `module.config.json` 获取模块信息
2. 打包项目为 `.tgz` 文件
3. 上传到注册中心
4. 自动关联 `appId` 和 `teamId`（如果配置）

### 版本管理

```bash
# 更新 package.json 版本号
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0

# 重新发布
npm run build
pnce publish
```

## 📥 安装模块

### 安装模式

#### 1. 外部依赖模式（--link）

```bash
# 添加到 modules.json
pnce install auth-module --link
```

- 存储位置：`src/external_modules/`
- 多个项目共享
- 适合可复用的通用模块
- 添加到 `modules.json` 的 `externalModules` 字段

#### 2. 本地集成模式（--save）

```bash
# 添加到 package.json
pnce install auth-module --save
```

- 存储位置：`src/local_modules/`
- 项目私有
- 适合项目特定的业务模块
- 添加到 `package.json` 的 `localModules` 字段

#### 3. 临时安装

```bash
# 不加入依赖管理
pnce install auth-module
```

- 存储位置：`src/external_modules/`
- 仅当前使用
- 适合快速测试

### 模块依赖处理

模块安装时自动处理依赖关系：

```bash
# 安装模块 A（依赖模块 B）
pnce install module-a --link

# CLI 会自动：
# 1. 检查 module-a 的 module.config.json
# 2. 查找已安装的 module-b（在父级目录）
# 3. 修正 module-a 中 module-b 的导入路径
# 4. 递归处理 module-a 的其他依赖
```

**导入路径自动修正**：
- 原路径：`./external_modules/module-b/src`
- 修正后：`../../module-b/src`

**注意**：Windows 系统下，工具会直接修正导入路径而非创建软链接，避免 EPERM 错误。

### 导入路径修正

如果已安装的模块导入路径未正确修正：

```bash
# 手动修正
pnce fix-imports module-name

# 指定目录（默认 src/external_modules）
pnce fix-imports module-name -d src/local_modules
```

## 🔗 依赖管理

### 初始化配置

```bash
# 初始化 modules.json
pnce modules-init
```

这会在项目根目录创建 `modules.json` 配置文件。

### 添加模块依赖

```bash
# 添加模块（使用最新版本）
pnce modules-add auth-module

# 添加指定版本
pnce modules-add auth-module ^1.0.0

# 添加模块但不立即安装
pnce modules-add auth-module --no-install
```

### 批量安装

```bash
# 安装所有依赖
pnce modules-install

# 强制重新安装所有模块
pnce modules-install --force
```

### 列出依赖

```bash
# 查看所有模块依赖
pnce modules-list
```

### 移除依赖

```bash
# 从 modules.json 移除模块
pnce modules-remove auth-module

# 然后清理已安装的模块
pnce modules-prune
```

### 清理未使用模块

```bash
# 清理不在 modules.json 中的已安装模块
pnce modules-prune
```

## 🚀 部署到 Linux 服务器

### 1. 准备部署环境

#### 系统要求

```bash
# Node.js 版本 >= 18
node --version

# npm 版本 >= 8
npm --version

# 检查可用的端口
netstat -tuln | grep LISTEN
```

#### 安装依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm

# CentOS/RHEL
sudo yum install -y nodejs npm

# 或使用 nvm 管理 Node.js 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. 部署服务

#### 方式一：直接部署（开发环境）

```bash
# 1. 上传代码到服务器
scp -r ./my-service user@server:/opt/services/

# 2. 登录服务器
ssh user@server

# 3. 进入项目目录
cd /opt/services/my-service

# 4. 安装依赖
npm install

# 5. 构建项目
npm run build

# 6. 启动服务
npm run start

# 7. 验证服务
curl http://localhost:3000
```

#### 方式二：使用 PM2（生产环境推荐）

```bash
# 1. 全局安装 PM2
npm install -g pm2

# 2. 上传代码
scp -r ./my-service user@server:/opt/services/

# 3. 登录服务器
ssh user@server

# 4. 进入项目目录
cd /opt/services/my-service

# 5. 安装依赖并构建
npm install
npm run build

# 6. 使用 PM2 启动
pm2 start dist/main.js --name user-service

# 7. 查看状态
pm2 status

# 8. 查看日志
pm2 logs user-service

# 9. 设置开机自启
pm2 startup
pm2 save
```

PM2 常用命令：

```bash
# 查看所有服务
pm2 list

# 重启服务
pm2 restart user-service

# 停止服务
pm2 stop user-service

# 删除服务
pm2 delete user-service

# 监控
pm2 monit
```

#### 方式三：使用 Docker

**Dockerfile 示例**：

```dockerfile
# 使用官方 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY dist ./dist

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/main.js"]
```

**docker-compose.yml 示例**：

```yaml
version: '3.8'

services:
  user-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

**部署命令**：

```bash
# 1. 构建镜像
docker build -t user-service:1.0.0 .

# 2. 运行容器
docker run -d -p 3000:3000 --name user-service user-service:1.0.0

# 3. 使用 Docker Compose
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 3. 配置 Nginx 反向代理

#### 创建 Nginx 配置

```nginx
# /etc/nginx/sites-available/user-service
upstream user_service {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.example.com;

    access_log /var/log/nginx/user-service-access.log;
    error_log /var/log/nginx/user-service-error.log;

    location / {
        proxy_pass http://user_service;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://user_service/health;
        access_log off;
    }
}
```

#### 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/user-service /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4. 配置 SSL 证书（HTTPS）

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.example.com

# 自动续期
sudo certbot renew --dry-run
```

#### 更新 Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://user_service;
        # ... 其他配置
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}
```

### 5. 监控和日志

#### 查看服务日志

```bash
# PM2 日志
pm2 logs user-service

# 系统日志
journalctl -u pm2-user-service -f

# 应用日志
tail -f /opt/services/my-service/logs/combined.log
```

#### 设置日志轮转

```bash
# /etc/logrotate.d/user-service
/opt/services/my-service/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload user-service
    endscript
}
```

### 6. 安全加固

#### 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 配置失败2ban

```bash
# 安装
sudo apt install fail2ban

# 创建配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 启动服务
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📁 配置文件

### module.config.json

项目根目录的配置文件：

```json
{
  "name": "module-name",
  "description": "模块描述",
  "author": "作者名",
  "version": "1.0.0",
  "type": "microservice",
  "appId": "",
  "teamId": "",
  "installedModules": {
    "dependency-module": "1.0.0"
  },
  "port": 3000
}
```

### modules.json

外部模块依赖配置：

```json
{
  "$schema": "https://pnce.example.com/schemas/modules.json",
  "options": {
    "installDir": "src/external_modules",
    "lockFile": true
  },
  "externalModules": {
    "module-name": "^1.0.0"
  }
}
```

### modules-lock.json

锁定文件，确保依赖版本一致：

```json
{
  "lockfileVersion": 1,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "modules": {
    "auth-module": {
      "version": "1.0.0",
      "resolved": "https://registry.example.com/api/modules/auth-module/1.0.0/download"
    }
  }
}
```

## ❓ 常见问题

### Q1: 安装模块时导入路径错误？

**A:** 使用 `fix-imports` 命令修正：

```bash
pnce fix-imports module-name
```

### Q2: Windows 下软链接创建失败？

**A:** 工具已自动处理，会直接修正导入路径而非创建软链接。

### Q3: 端口冲突怎么办？

**A:** 使用不同的端口：

```bash
pnce install module-name -p 3001
```

查看端口分配信息：

```bash
pnce ports

# 或使用 -s 选项
pnce ports -s
```

清除端口缓存：

```bash
pnce ports -c
```

### Q4: 如何查看已安装的模块？

**A:** 使用 `modules-list` 命令或查看配置文件：

```bash
# 使用命令列出所有依赖
pnce modules-list

# 或查看配置文件
# 外部模块（modules.json）
cat modules.json

# 本地模块（package.json）
cat package.json | grep localModules
```

### Q5: 部署后服务无法启动？

**A:** 检查以下几点：

```bash
# 1. 检查 Node.js 版本
node --version

# 2. 检查依赖安装
npm list

# 3. 检查端口占用
netstat -tuln | grep 3000

# 4. 查看错误日志
pm2 logs user-service
```

### Q6: 如何回滚到旧版本？

**A:** 安装指定版本：

```bash
pnce install module-name@1.0.0 --link
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
