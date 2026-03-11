import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.task.findMany({
      where: { userId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.isDeleted) throw new NotFoundException('Task not found');
    if (task.userId !== userId) throw new ForbiddenException();
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'medium',
        scheduledDate: dto.scheduledDate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        categoryId: dto.categoryId,
        recurrenceRule: dto.recurrenceRule,
        reminderFreqMin: dto.reminderFreqMin ?? 60,
        reminderStart: dto.reminderStart ?? '08:00',
        reminderEnd: dto.reminderEnd ?? '23:00',
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    await this.findOne(id, userId);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.scheduledDate !== undefined && { scheduledDate: dto.scheduledDate }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
        ...(dto.reminderFreqMin !== undefined && { reminderFreqMin: dto.reminderFreqMin }),
        ...(dto.reminderStart !== undefined && { reminderStart: dto.reminderStart }),
        ...(dto.reminderEnd !== undefined && { reminderEnd: dto.reminderEnd }),
        ...(dto.completedAt !== undefined && { completedAt: dto.completedAt ? new Date(dto.completedAt) : null }),
        ...(dto.isDeleted !== undefined && { isDeleted: dto.isDeleted }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
