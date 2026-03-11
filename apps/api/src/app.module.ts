import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { CategoriesModule } from './categories/categories.module';
import { SyncModule } from './sync/sync.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// .env is loaded early in main.ts via dotenv before NestJS bootstraps,
// so ConfigModule just reads from process.env directly.

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cron scheduler for push notification jobs
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    TasksModule,
    CategoriesModule,
    SyncModule,
    NotificationsModule,
  ],
  providers: [
    // Apply JwtAuthGuard globally; use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
