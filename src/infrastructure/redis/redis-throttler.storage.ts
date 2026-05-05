import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import IORedis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-backed throttler storage.
 *
 * Keys follow the pattern:
 *   throttler:{throttlerName}:{tracker}     – hit counter
 *   throttler:block:{throttlerName}:{tracker} – block marker
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: IORedis,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const counterKey = `throttler:${throttlerName}:${key}`;
    const blockKey = `throttler:block:${throttlerName}:${key}`;

    const isBlocked = await this.redis.exists(blockKey);

    if (isBlocked) {
      const blockTtl = await this.redis.pttl(blockKey);

      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(blockTtl / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtl / 1000),
      };
    }

    const totalHits = await this.redis.incr(counterKey);

    if (totalHits === 1) {
      await this.redis.expire(counterKey, ttl);
    }

    const timeToExpire = await this.redis.ttl(counterKey);

    if (totalHits > limit && blockDuration > 0) {
      await this.redis.setex(blockKey, blockDuration, '1');

      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
