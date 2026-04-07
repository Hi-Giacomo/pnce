import { NestFactory } from '@nestjs/core';
import { MainModule } from './modules';
import { Logger } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Main');

  // 创建主应用
  const app = await NestFactory.create(MainModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  // 配置静态文件服务 - / 访问 src/service/public 目录
  const expressApp = app.getHttpAdapter().getInstance();
  const serveStatic = require('serve-static');
  expressApp.use(
    '/',
    serveStatic(join(__dirname, '../public'), {
      index: ['/app/index.html'],
      dotfiles: 'ignore',
    })
  );

  const port = process.env.PORT || 3000;

  await app.listen(port);

  // 输出启动信息
  logger.log(`╭────────────────────────────────────────╮`);
  logger.log(`│  🚀 Service started on port ${port}`.padEnd(36) + `│`);
  logger.log(`│  📍 http://localhost:${port}/api`.padEnd(36) + `│`);
  logger.log(`│  📁 http://localhost:${port}/  `.padEnd(36) + `│`);
  logger.log(`╰────────────────────────────────────────╯`);
}

bootstrap();
