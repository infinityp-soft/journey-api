import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';

/**
 * Provides the ability factory and policies guard app-wide.
 * Marked @Global so feature modules can use @CheckPolicies without re-importing.
 */
@Global()
@Module({
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class CaslModule {}
