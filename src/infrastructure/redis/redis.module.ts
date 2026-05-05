import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

import { EnvironmentVariables } from '../../config/environment';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>): IORedis =>
        new IORedis(config.get('REDIS_URL', { infer: true }), {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        }),
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
