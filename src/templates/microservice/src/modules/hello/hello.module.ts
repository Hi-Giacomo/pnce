import { Module } from '@nestjs/common';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [EnvModule],
  controllers: [HelloController],
  providers: [HelloService],
  exports: [HelloService],
})
export class HelloModule {}
