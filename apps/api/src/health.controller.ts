import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get()
  root() {
    return { status: 'ok', docs: '/api-docs' };
  }

  @Public()
  @Get('health')
  check() {
    return { status: 'ok' };
  }
}
