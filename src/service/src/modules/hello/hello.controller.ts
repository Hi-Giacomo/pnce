import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HELLO_MSG } from './hello.messages';

@Controller('hello')
export class HelloController {
  constructor(@Optional() @Inject('MICROSERVICE_CLIENT') private microservice?: ClientProxy) {}

  @Get('world')
  getHelloWorld() {
    if (!this.microservice) {
      return { message: 'Microservice not connected', data: HELLO_MSG.world };
    }

    return this.microservice.send(HELLO_MSG.world, {});
  }
}
