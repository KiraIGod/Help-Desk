import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();

      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Redis unreachable',
      });
    }
  }
}
