import { SetMetadata } from '@nestjs/common';
import { TokenScope } from '../../auth/jwt.strategy';

export const SCOPES_KEY = 'scopes';

/**
 * Restricts an endpoint to tokens whose scope is listed here.
 * Example: @Scopes('user') blocks agent tokens.
 *          @Scopes('user', 'agent') allows both (same as omitting the decorator).
 */
export const Scopes = (...scopes: TokenScope[]) =>
  SetMetadata(SCOPES_KEY, scopes);
