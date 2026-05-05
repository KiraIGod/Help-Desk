import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

import { EnvironmentVariables } from '../../config/environment';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
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
    const ttl =
      ttlSeconds ?? this.config.get('REDIS_CACHE_TTL_SECONDS', { infer: true }) ?? 300;

    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await this.redis.del(...keys);
  }

  /**
   * Deletes all keys matching a given glob pattern.
   * Uses SCAN to avoid blocking the event loop on large keyspaces.
   *
   * Example: invalidateByPattern('tickets:list:*')
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  /**
   * Atomic increment – useful for rate-limiting counters or cache versioning.
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const pipeline = this.redis.pipeline();

    pipeline.incr(key);

    if (ttlSeconds) {
      pipeline.expire(key, ttlSeconds);
    }

    const results = await pipeline.exec();

    // results[0] = [error, value] of INCR
    return (results?.[0]?.[1] as number) ?? 0;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
