import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, PushTokenDto } from './auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('agent-token')
  @HttpCode(HttpStatus.OK)
  generateAgentToken(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.generateAgentToken(user.id, user.email);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  savePushToken(
    @CurrentUser() user: { id: string },
    @Body() dto: PushTokenDto,
  ) {
    return this.authService.savePushToken(user.id, dto.pushToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout() {
    // Stateless JWT - tokens expire naturally
    return;
  }
}
