import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from monorepo root before NestJS bootstraps the DI container.
// __dirname is apps/api/src in watch mode and apps/api/dist when compiled.
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../..', '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Swagger — agent-oriented API documentation
  const config = new DocumentBuilder()
    .setTitle('DayFrame API')
    .setDescription(
      'DayFrame task management API.\n\n' +
      '## Agent authentication\n\n' +
      'Agents authenticate using a short-lived **agent token** (1 hour). ' +
      'To obtain one, a human user must first log in and call `POST /auth/agent-token` ' +
      'with their access token. The returned `agentToken` is then used as a ' +
      '`Bearer` token to call `POST /tasks`.\n\n' +
      '```\nAuthorization: Bearer <agentToken>\n```',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'agent-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs-json',
  });

  // Use PORT from environment (required by Render)
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`DayFrame API running on port ${port}`);
  console.log(`API docs available at http://localhost:${port}/api-docs`);
}
bootstrap();
