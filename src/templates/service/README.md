# service

主服务项目

## 安装

```bash
npm install
```

## 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run start:prod
```

## 构建

```bash
npm run build
```

## 项目结构

- `src/` - 源代码
- `src/config/` - 配置文件
- `src/modules/` - 模块
- `src/utils/` - 工具函数
- `scripts/` - 脚本文件
- `test/` - 测试文件
- `document/` - 文档

## 配置

编辑 `module.config.json` 来配置应用和团队关联：

```json
{
  "appId": "your-app-id",
  "teamId": "your-team-id"
}
```
