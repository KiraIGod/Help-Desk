import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../../config/environment';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { EmailNotificationProducer } from './producers/email-notification.producer';
import { QUEUE_NAMES } from './queue.names';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        connection: {
          url: config.get('REDIS_URL', { infer: true }),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.emailNotifications,
    }),
  ],
  providers: [EmailNotificationProducer, EmailNotificationProcessor],
  exports: [BullModule, EmailNotificationProducer],
})
export class QueuesModule {}
