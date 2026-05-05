import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../../config/environment';
import { EmailNotificationProducer } from './producers/email-notification.producer';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.names';
import { EmailWorker } from './workers/email.worker';

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
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.emailNotifications,
    }),
  ],
  providers: [EmailNotificationProducer, EmailWorker, QueueService],
  exports: [BullModule, QueueService, EmailNotificationProducer],
})
export class QueueModule {}
