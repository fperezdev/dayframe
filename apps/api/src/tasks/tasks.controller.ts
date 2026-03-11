import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(ScopeGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // ── User-only endpoints ──────────────────────────────────────────────────

  @Get()
  @Scopes('user')
  findAll(@CurrentUser() user: { id: string }) {
    return this.tasksService.findAll(user.id);
  }

  @Get(':id')
  @Scopes('user')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(':id')
  @Scopes('user')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Scopes('user')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.tasksService.remove(id, user.id);
  }

  // ── Agent-accessible endpoint ────────────────────────────────────────────

  @Post()
  @Scopes('user', 'agent')
  @ApiBearerAuth('agent-token')
  @ApiOperation({
    summary: 'Create a task',
    description:
      'Creates a new task for the authenticated user.\n\n' +
      'This is the **only endpoint accessible with an agent token** ' +
      '(`scope: agent`). User tokens (`scope: user`) are also accepted.\n\n' +
      '**Step 2 of the agent workflow** — call this endpoint with the ' +
      '`agentToken` obtained from `POST /auth/agent-token`.',
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully. Returns the full task object.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        title: { type: 'string', example: 'Review pull request #42' },
        description: { type: 'string', nullable: true },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed'],
          example: 'pending',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          example: 'high',
        },
        scheduledDate: { type: 'string', nullable: true, example: '2026-03-11' },
        dueDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2026-03-11T18:00:00.000Z',
        },
        categoryId: { type: 'string', format: 'uuid', nullable: true },
        recurrenceRule: { type: 'string', nullable: true },
        reminderFreqMin: { type: 'integer', example: 60 },
        reminderStart: { type: 'string', example: '08:00' },
        reminderEnd: { type: 'string', example: '23:00' },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        isDeleted: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — check the request body fields.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or expired token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Token scope is not allowed. Only `user` and `agent` tokens are accepted.',
  })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }
}
