import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'Short title of the task.',
    example: 'Review pull request #42',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Optional longer description or notes.',
    example: 'Check the auth changes in the feature/agent-docs branch.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Task priority. Defaults to `medium` when omitted.',
    example: 'high',
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Date the task is scheduled for, in `YYYY-MM-DD` format.',
    example: '2026-03-11',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Hard deadline as an ISO 8601 datetime string.',
    example: '2026-03-11T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'UUID of the category to assign the task to.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'iCal RRULE string for recurring tasks.',
    example: 'FREQ=DAILY;INTERVAL=1',
  })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiPropertyOptional({
    description:
      'How often (in minutes) to send push reminders. Must be between 5 and 1440. Defaults to 60.',
    minimum: 5,
    maximum: 1440,
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  reminderFreqMin?: number;

  @ApiPropertyOptional({
    description:
      'Earliest time of day to send reminders, in `HH:MM` (24-hour) format. Defaults to `08:00`.',
    example: '08:00',
  })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  reminderStart?: string;

  @ApiPropertyOptional({
    description:
      'Latest time of day to send reminders, in `HH:MM` (24-hour) format. Defaults to `23:00`.',
    example: '23:00',
  })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  reminderEnd?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  reminderFreqMin?: number;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  reminderStart?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  reminderEnd?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
