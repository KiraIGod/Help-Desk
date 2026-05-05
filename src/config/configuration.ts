import { EnvironmentVariables } from './environment';

const parseCorsOrigins = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export default (): EnvironmentVariables => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_NAME: process.env.APP_NAME ?? 'HelpDesk API',
  APP_PORT: Number(process.env.APP_PORT ?? 3000),
  API_PREFIX: process.env.API_PREFIX ?? 'api/v1',
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_CACHE_TTL_SECONDS: Number(process.env.REDIS_CACHE_TTL_SECONDS ?? 300),
  EMAIL_QUEUE_CONCURRENCY: Number(process.env.EMAIL_QUEUE_CONCURRENCY ?? 5),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
});
