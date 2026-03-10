import { module } from '@nestjs/common';
import { Configmodule } from '@nestjs/config';
import { EnvController } from './env.controller';
import { EnvService } from './env.service';
import envConfig from '../../config/env.config';

@module({
  imports: [
    Configmodule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
  ],
  controllers: [EnvController],
  providers: [EnvService],
  exports: [EnvService],
})
export class Envmodule {}
