import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Action } from './action.enum';
import { AppAbility } from './casl-ability.factory';
import { PolicyHandlerCallback } from './policy-handler';
import { AppSubject } from './subjects';

/**
 * Inject the current request's CASL ability into a controller method.
 *
 *   @Get()
 *   findAll(@UserAbility() ability: AppAbility) { ... }
 */
export const UserAbility = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppAbility => {
    const request = ctx.switchToHttp().getRequest<{ ability?: AppAbility }>();
    if (!request.ability) {
      throw new ForbiddenException(
        'Ability not initialized (is PoliciesGuard applied?)',
      );
    }
    return request.ability;
  },
);

/**
 * Tiny factory for the most common policy: "can <action> <subject>".
 *
 *   @CheckPolicies(can(Action.Create, 'Article'))
 */
export const can =
  (action: Action, subject: AppSubject): PolicyHandlerCallback =>
  (ability: AppAbility) =>
    ability.can(action, subject);
