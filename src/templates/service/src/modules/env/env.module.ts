import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvController } from './env.controller';
import { EnvService } from './env.service';
import envConfig from '../../config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
  ],
  controllers: [EnvController],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
