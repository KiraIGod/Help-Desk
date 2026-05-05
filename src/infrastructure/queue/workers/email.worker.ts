import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { StructuredLoggerService } from '../../logger/structured-logger.service';
import { QUEUE_NAMES } from '../queue.names';
import { EmailNotificationJob } from '../types/email-notification-job';

@Injectable()
@Processor(QUEUE_NAMES.emailNotifications, {
  concurrency: parseInt(process.env['EMAIL_QUEUE_CONCURRENCY'] ?? '5', 10),
})
export class EmailWorker extends WorkerHost {
  constructor(private readonly logger: StructuredLoggerService) {
    super();
  }

  async process(job: Job<EmailNotificationJob>): Promise<void> {
    const { type, recipientUserId, ticketId, subject } = job.data;

    this.logger.log('email_job_processing', EmailWorker.name, {
      jobId: job.id,
      type,
      recipientUserId,
      ticketId,
      subject,
      attempt: job.attemptsMade + 1,
    });

    await this.deliver(job.data);

    this.logger.log('email_job_done', EmailWorker.name, {
      jobId: job.id,
      type,
      recipientUserId,
      ticketId,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailNotificationJob>, error: Error): void {
    this.logger.error('email_job_failed', error.stack, EmailWorker.name, {
      jobId: job.id,
      type: job.data.type,
      recipientUserId: job.data.recipientUserId,
      ticketId: job.data.ticketId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });
  }

  /**
   * Replace with your transport of choice: SendGrid, AWS SES, Nodemailer, etc.
   */
  private async deliver(data: EmailNotificationJob): Promise<void> {
    this.logger.debug('email_deliver_stub', EmailWorker.name, {
      subject: data.subject,
      recipientUserId: data.recipientUserId,
    });
  }
}
