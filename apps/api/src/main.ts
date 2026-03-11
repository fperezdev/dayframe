import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from monorepo root before NestJS bootstraps the DI container.
// __dirname is apps/api/src in watch mode and apps/api/dist when compiled.
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../..', '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation — strip unknown fields, throw on bad input
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — allow Expo dev client and any future web client
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Use PORT from environment (required by Render)
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`DayFrame API running on port ${port}`);
}
bootstrap();
