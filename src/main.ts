import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment';
import { StructuredLoggerService } from './infrastructure/logging/structured-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const logger = app.get(StructuredLoggerService);
  app.useLogger(logger);
  const apiPrefix = config.get('API_PREFIX', { infer: true });
  const port = config.get('APP_PORT', { infer: true });
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });

  app.use(helmet());
  app.use(compression());
  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);

  logger.log(`API is running on port ${port}`, 'Bootstrap');
}

void bootstrap();
