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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';

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
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }
}
