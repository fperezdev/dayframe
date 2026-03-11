import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task as SharedTask, Category as SharedCategory } from '@dayframe/shared';

interface SyncPayload {
  tasks: SharedTask[];
  categories: SharedCategory[];
  lastSyncedAt?: string;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async sync(userId: string, payload: SyncPayload) {
    const serverTime = new Date();

    // ── Apply client changes ───────────────────────────────────────────────────

    // Upsert categories first (tasks may reference them)
    for (const cat of payload.categories) {
      if (cat.userId !== userId) continue; // security check
      await this.prisma.category.upsert({
        where: { id: cat.id },
        create: {
          id: cat.id,
          userId,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDeleted: cat.isDeleted,
        },
        update: {
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDeleted: cat.isDeleted,
          updatedAt: new Date(cat.updatedAt),
        },
      });
    }

    // Upsert tasks
    for (const task of payload.tasks) {
      if (task.userId !== userId) continue;
      await this.prisma.task.upsert({
        where: { id: task.id },
        create: {
          id: task.id,
          userId,
          title: task.title,
          description: task.description,
          status: task.status as any,
          priority: task.priority as any,
          scheduledDate: task.scheduledDate,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          categoryId: task.categoryId,
          recurrenceRule: task.recurrenceRule,
          reminderFreqMin: task.reminderFreqMin,
          reminderStart: task.reminderStart,
          reminderEnd: task.reminderEnd,
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
          isDeleted: task.isDeleted,
        },
        update: {
          title: task.title,
          description: task.description,
          status: task.status as any,
          priority: task.priority as any,
          scheduledDate: task.scheduledDate,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          categoryId: task.categoryId,
          recurrenceRule: task.recurrenceRule,
          reminderFreqMin: task.reminderFreqMin,
          reminderStart: task.reminderStart,
          reminderEnd: task.reminderEnd,
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
          isDeleted: task.isDeleted,
          updatedAt: new Date(task.updatedAt),
        },
      });
    }

    // ── Pull server changes since last sync ────────────────────────────────────

    const since = payload.lastSyncedAt ? new Date(payload.lastSyncedAt) : new Date(0);

    const [serverTasks, serverCategories] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId, updatedAt: { gt: since } },
      }),
      this.prisma.category.findMany({
        where: { userId, updatedAt: { gt: since } },
      }),
    ]);

    // Serialize to shared Task/Category format
    const tasks: SharedTask[] = serverTasks.map((t) => ({
      id: t.id,
      userId: t.userId,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status as any,
      priority: t.priority as any,
      scheduledDate: t.scheduledDate ?? undefined,
      dueDate: t.dueDate?.toISOString() ?? undefined,
      categoryId: t.categoryId ?? undefined,
      recurrenceRule: t.recurrenceRule ?? undefined,
      reminderFreqMin: t.reminderFreqMin,
      reminderStart: t.reminderStart,
      reminderEnd: t.reminderEnd,
      completedAt: t.completedAt?.toISOString() ?? undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isDeleted: t.isDeleted,
    }));

    const categories: SharedCategory[] = serverCategories.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      color: c.color,
      icon: c.icon ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      isDeleted: c.isDeleted,
    }));

    return {
      tasks,
      categories,
      serverTime: serverTime.toISOString(),
    };
  }
}
