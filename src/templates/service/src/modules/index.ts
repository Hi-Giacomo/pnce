import { Module } from '@nestjs/common';
import { EnvModule } from './env/env.module';
import { HelloModule } from './hello/hello.module';

@Module({
  imports: [EnvModule, HelloModule],
})
export class MainModule {}
