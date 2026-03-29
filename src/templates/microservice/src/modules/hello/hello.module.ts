import { Module } from '@nestjs/common';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';
import { ClientsModule } from '@nestjs/microservices';
import { ModulesConfig } from 'src/config/modules.config';

@Module({
  imports: [ClientsModule.register([])],
  controllers: [HelloController],
  providers: [HelloService],
  exports: [HelloService],
})
export class HelloModule {}
