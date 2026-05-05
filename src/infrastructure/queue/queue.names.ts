export const QUEUE_NAMES = {
  emailNotifications: 'email-notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
