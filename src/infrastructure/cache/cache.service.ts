import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

import { EnvironmentVariables } from '../../config/environment';
import { REDIS_CLIENT } from './cache.constants';

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: IORedis,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlSeconds ?? this.config.get('REDIS_CACHE_TTL_SECONDS', { infer: true }),
    );
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await this.redis.del(...keys);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
