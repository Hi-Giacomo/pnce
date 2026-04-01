import { ClientProviderOptions, Transport } from '@nestjs/microservices';
import { ServiceConnectTypes, ServiceTypes } from '../typings/service.typs';

export const ModulesConfig: Record<
  ServiceConnectTypes,
  Record<ServiceTypes, Record<string, ClientProviderOptions>>
> = {
  local: {
    tcp: {
      microservice: {
        name: 'MICROSERVICE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4000,
          retryAttempts: 3,
          retryDelay: 1000,
        },
      },
    },
    http: {},
  },
  remote: {
    tcp: {},
    http: {},
  },
};
