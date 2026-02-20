import { Module } from '@nestjs/common';
import { MicroserviceController } from './app.controller';
import { MicroserviceService } from './app.service';

@Module({
  controllers: [MicroserviceController],
  providers: [MicroserviceService],
  exports: [MicroserviceService],
})
export class MicroserviceModule {}
