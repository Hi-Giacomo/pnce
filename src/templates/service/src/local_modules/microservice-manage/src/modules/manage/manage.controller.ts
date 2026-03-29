import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { ManageService } from './manage.service';
import { MessagePattern } from '@nestjs/microservices';
import { MSG } from './manage.messages';

@Controller()
export class ManageController implements OnModuleInit {
  constructor(private readonly manageService: ManageService) {}

  async onModuleInit() {
    await this.start();
  }

  async start() {
    const logger = new Logger('MicroserviceManage');
    logger.log('Microservice manage start logic executed');
    await this.manageService.start();
  }

  @MessagePattern(MSG.world)
  async getHelloWorld() {
    return {
      message: 'Hello, World!',
      service: 'microservice',
      timestamp: new Date().toISOString(),
    };
  }
}
