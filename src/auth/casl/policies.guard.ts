import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AppAbility,
  AuthUser,
  CaslAbilityFactory,
} from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  IPolicyHandler,
  PolicyHandler,
} from './policy-handler';

/**
 * Evaluates the @CheckPolicies() attached to a route against the ability built
 * for the request user. Runs AFTER the global JWT auth guard, so `request.user`
 * is set. The built ability is attached to `request.ability` for row/field
 * checks in controllers and services.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser; ability?: AppAbility }>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const ability = this.caslAbilityFactory.createForUser(request.user);
    request.ability = ability;

    if (handlers.length === 0) return true;

    const allowed = handlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    return true;
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') return handler(ability);
    return (handler as IPolicyHandler).handle(ability);
  }
}
