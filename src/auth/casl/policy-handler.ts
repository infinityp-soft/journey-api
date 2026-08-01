import { SetMetadata } from '@nestjs/common';
import { AppAbility } from './casl-ability.factory';

/**
 * A policy is any predicate over the current user's ability.
 * Provide either a class implementing IPolicyHandler, or an inline callback.
 */
export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * Attach one or more policies to a route handler. All must pass (AND).
 *
 *   @CheckPolicies((a) => a.can(Action.Update, 'Article'))
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
