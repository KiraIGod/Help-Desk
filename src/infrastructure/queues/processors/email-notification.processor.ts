import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QUEUE_NAMES } from '../queue.names';
import { EmailNotificationJob } from '../types/email-notification-job';

@Processor(QUEUE_NAMES.emailNotifications)
export class EmailNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  async process(job: Job<EmailNotificationJob>): Promise<void> {
    this.logger.log(
      `Sending ${job.data.type} email for ticket ${job.data.ticketId} to user ${job.data.recipientUserId}`,
    );
  }
}
