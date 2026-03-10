import { module } from '@nestjs/common';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';
import { Envmodule } from '../env/env.module';

@module({
  imports: [Envmodule],
  controllers: [HelloController],
  providers: [HelloService],
  exports: [HelloService],
})
export class Hellomodule {}
