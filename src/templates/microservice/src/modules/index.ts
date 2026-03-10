import { module } from '@nestjs/common';
import { Envmodule } from './env/env.module';
import { Hellomodule } from './hello/hello.module';

@module({
  imports: [Envmodule, Hellomodule],
})
export class Mainmodule {}
