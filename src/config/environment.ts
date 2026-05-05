export type NodeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment | string;
  APP_NAME: string;
  APP_PORT: number;
  API_PREFIX: string;
  CORS_ORIGINS: string[];
  DATABASE_URL?: string;
  REDIS_URL?: string;
  REDIS_CACHE_TTL_SECONDS: number;
  EMAIL_QUEUE_CONCURRENCY: number;
  JWT_ACCESS_SECRET?: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET?: string;
  JWT_REFRESH_EXPIRES_IN: string;
  LOG_LEVEL: string;
}
