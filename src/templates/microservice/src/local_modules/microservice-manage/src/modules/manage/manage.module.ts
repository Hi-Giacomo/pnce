import { Module } from '@nestjs/common';
import { ManageController } from './manage.controller';
import { ManageService } from './manage.service';
import { ClientsModule } from '@nestjs/microservices';
import { ModulesConfig } from 'src/config/modules.config';

@Module({
  imports: [ClientsModule.register([])],
  controllers: [ManageController],
  providers: [ManageService],
  exports: [ManageService],
})
export class ManageModule {}
