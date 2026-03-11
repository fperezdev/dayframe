import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Send push notifications via Expo Push API ─────────────────────────────

  async sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    // Expo supports up to 100 messages per request
    const chunks = this.chunkArray(messages, 100);

    for (const chunk of chunks) {
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          this.logger.error(
            `Expo Push API error: ${response.status} ${response.statusText}`,
          );
          continue;
        }

        const result = (await response.json()) as { data: ExpoPushTicket[] };
        for (const ticket of result.data) {
          if (ticket.status === 'error') {
            this.logger.warn(
              `Push ticket error: ${ticket.message} (${ticket.details?.error})`,
            );
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push notifications', err);
      }
    }
  }

  // ── Cron: send reminders for tasks due today ─────────────────────────────
  // Runs every 30 minutes. Finds tasks scheduled today that are not completed
  // and have a push token on their owner's account.

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendDailyReminders(): Promise<void> {
    this.logger.log('Running daily reminder cron job');

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const tasks = await this.prisma.task.findMany({
      where: {
        scheduledDate: todayStr,
        isDeleted: false,
        status: { not: 'completed' },
        user: { pushToken: { not: null } },
      },
      include: { user: { select: { pushToken: true } } },
    });

    if (tasks.length === 0) return;

    const messages: ExpoPushMessage[] = tasks
      .filter((t) => t.user.pushToken)
      .map((task) => ({
        to: task.user.pushToken as string,
        sound: 'default',
        title: 'Task Reminder',
        body: task.title,
        data: { taskId: task.id },
      }));

    await this.sendPushNotifications(messages);
    this.logger.log(`Sent ${messages.length} reminder notifications`);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
