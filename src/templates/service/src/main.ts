import { NestFactory } from '@nestjs/core';
import { MainModule } from './modules';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { MSMMainModule } from './local_modules/microservice-manage';

async function bootstrap() {
  const logger = new Logger('Main');

  // 创建主应用
  const app = await NestFactory.create(MainModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 创建微服务管理模块
  const microserviceApp = await NestFactory.createMicroservice(MSMMainModule, {
    name: 'MICROSERVICE_MANAGE_APP',
    transport: Transport.TCP,
    options: {
      port: process.env.MICROSERVICE_PORT ? parseInt(process.env.MICROSERVICE_PORT) + 1 : 3001,
      host: process.env.MICROSERVICE_HOST || 'localhost',
    },
  });

  await microserviceApp.listen();

  // 输出启动信息
  logger.log(`╭────────────────────────────────────────╮`);
  logger.log(`│  🚀 Service started on port ${port}`.padEnd(36) + `│`);
  logger.log(`│  📍 http://localhost:${port}/api`.padEnd(36) + `│`);
  logger.log(`╰────────────────────────────────────────╯`);
}

bootstrap();
