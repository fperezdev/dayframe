import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenScope } from '../../auth/jwt.strategy';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<TokenScope[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Scopes() annotation — any valid token is allowed
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{
      user: { id: string; email: string; scope: TokenScope };
    }>();

    const tokenScope: TokenScope = user?.scope ?? 'user';

    if (!required.includes(tokenScope)) {
      throw new ForbiddenException(
        `This endpoint requires scope: ${required.join(' | ')}. ` +
          `Your token has scope: ${tokenScope}.`,
      );
    }

    return true;
  }
}
