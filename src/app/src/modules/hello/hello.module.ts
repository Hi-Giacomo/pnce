import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';
import { ModulesConfig } from '../../config/modules.config';

@Module({
  imports: [ClientsModule.register([ModulesConfig.local.tcp.microservice])],
  controllers: [HelloController],
  providers: [HelloService],
  exports: [HelloService],
})
export class HelloModule {}
