import { Module } from '@nestjs/common';
import { ManageModule } from './manage/manage.module';

@Module({
  imports: [ManageModule],
})
export class MSMMainModule {}
