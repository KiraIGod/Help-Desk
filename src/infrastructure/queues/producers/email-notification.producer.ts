import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../queue.names';
import { EmailNotificationJob } from '../types/email-notification-job';

@Injectable()
export class EmailNotificationProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.emailNotifications)
    private readonly queue: Queue<EmailNotificationJob>,
  ) {}

  async enqueue(job: EmailNotificationJob): Promise<void> {
    await this.queue.add(job.type, job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: {
        age: 604800,
      },
    });
  }
}
