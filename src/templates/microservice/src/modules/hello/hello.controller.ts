import { Controller } from '@nestjs/common';
import { HelloService } from './hello.service';
import { MessagePattern } from '@nestjs/microservices';
import { MSG } from './hello.messages';

@Controller()
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @MessagePattern(MSG.world)
  getHelloWorld() {
    return {
      message: 'Hello, World!',
      service: 'microservice',
      timestamp: new Date().toISOString(),
    };
  }
}
