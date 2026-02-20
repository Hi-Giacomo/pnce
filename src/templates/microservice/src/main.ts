import { NestFactory } from '@nestjs/core';
import { MicroserviceModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(MicroserviceModule);
  
  // 启用 CORS
  app.enableCors();
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 microservice 服务已启动`);
  console.log(`📡 监听端口: ${port}`);
  console.log(`🌐 访问地址: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
