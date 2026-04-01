import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { MainModule } from './modules';

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

  console.log(`✅ Microservice started on port ${process.env.MICROSERVICE_PORT || '4000'}`);
}

bootstrap();
