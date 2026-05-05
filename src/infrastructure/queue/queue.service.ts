import { Injectable } from '@nestjs/common';

import { EmailNotificationProducer } from './producers/email-notification.producer';
import { EmailNotificationJob } from './types/email-notification-job';

/**
 * QueueService is the application-level abstraction over the underlying queue transport.
 *
 * Callers (use-cases, services) depend on QueueService, not on the concrete producer.
 * This makes it easy to swap the transport (BullMQ → SQS → in-memory) without
 * touching business logic.
 */
@Injectable()
export class QueueService {
  constructor(private readonly emailProducer: EmailNotificationProducer) {}

  /**
   * Enqueue an email notification for background processing.
   * Jobs are retried 3 times with exponential backoff on failure.
   */
  async sendEmail(data: EmailNotificationJob, delayMs?: number): Promise<void> {
    await this.emailProducer.enqueue(data, delayMs);
  }
}
