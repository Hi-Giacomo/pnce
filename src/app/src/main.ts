import { NestFactory } from '@nestjs/core';
import { MainModule } from './modules';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main');

  // 创建主应用
  const app = await NestFactory.create(MainModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 输出启动信息
  logger.log(`╭────────────────────────────────────────╮`);
  logger.log(`│  🚀 Service started on port ${port}`.padEnd(36) + `│`);
  logger.log(`│  📍 http://localhost:${port}/api`.padEnd(36) + `│`);
  logger.log(`╰────────────────────────────────────────╯`);
}

bootstrap();
