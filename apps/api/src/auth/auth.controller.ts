import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, PushTokenDto } from './auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
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
  @ApiBearerAuth('agent-token')
  @ApiOperation({
    summary: 'Mint an agent token',
    description:
      'Exchange a valid **user** access token for a short-lived **agent** token ' +
      '(expires in 1 hour). The agent token can then be used as a `Bearer` token ' +
      'to call `POST /tasks` on behalf of the authenticated user.\n\n' +
      '**Step 1 of the agent workflow** — call this once per session and store ' +
      'the returned `agentToken` securely.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent token minted successfully.',
    schema: {
      type: 'object',
      properties: {
        agentToken: {
          type: 'string',
          description: 'JWT with scope=agent, valid for 1 hour.',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: {
          type: 'string',
          description: 'Human-readable token lifetime.',
          example: '1h',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid user access token.',
  })
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
