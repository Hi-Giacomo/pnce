import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { MainModule } from './modules';
import { MSMMainModule } from './local_modules/microservice-manage';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(MainModule, {
    name: 'MICROSERVICE_SERVICE',
    transport: Transport.TCP,
    options: {
      port: parseInt(process.env.MICROSERVICE_PORT || '4000'),
      host: process.env.MICROSERVICE_HOST || 'localhost',
    },
  });
  await app.listen();

  // 创建微服务管理模块
  const microserviceApp = await NestFactory.createMicroservice(MSMMainModule, {
    name: 'MICROSERVICE_MANAGE_APP',
    transport: Transport.TCP,
    options: {
      port: process.env.MICROSERVICE_PORT ? parseInt(process.env.MICROSERVICE_PORT) + 1 : 4001,
      host: process.env.MICROSERVICE_HOST || 'localhost',
    },
  });

  await microserviceApp.listen();

  console.log(`✅ Microservice started on port ${process.env.MICROSERVICE_PORT || '4000'}`);
}

bootstrap();
