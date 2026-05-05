import { Injectable } from '@nestjs/common';

import { EmailNotificationProducer } from './producers/email-notification.producer';
import { EmailNotificationJob } from './types/email-notification-job';

@Injectable()
export class QueueService {
  constructor(private readonly emailProducer: EmailNotificationProducer) {}

  async sendEmail(data: EmailNotificationJob, delayMs?: number): Promise<void> {
    await this.emailProducer.enqueue(data, delayMs);
  }
}
