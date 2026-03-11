import { Body, Controller, Post } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Task as SharedTask, Category as SharedCategory } from '@dayframe/shared';

class SyncDto {
  tasks: SharedTask[];
  categories: SharedCategory[];
  lastSyncedAt?: string;
}

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  sync(@CurrentUser() user: { sub: string }, @Body() body: SyncDto) {
    return this.syncService.sync(user.sub, body);
  }
}
