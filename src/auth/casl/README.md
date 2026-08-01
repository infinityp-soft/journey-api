# Authorization (CASL)

Role-based permissions for the CMS, matching the **Admin / Editor / Viewer**
roles from the Add User modal.

## Pieces

| File | Purpose |
|---|---|
| `action.enum.ts` | Actions: `manage` (wildcard), `create`, `read`, `update`, `delete`, `publish` |
| `subjects.ts` | One subject per module (`Banner`, `Article`, `User`, …) |
| `casl-ability.factory.ts` | Builds the `AppAbility` for a user from their role |
| `policies.guard.ts` | Evaluates `@CheckPolicies()` on a route; attaches `request.ability` |
| `policy-handler.ts` | `@CheckPolicies()` decorator + handler types |
| `ability.decorator.ts` | `@UserAbility()` param decorator + `can(action, subject)` helper |
| `casl.module.ts` | Global module exposing the factory + guard |

## Role matrix

- **admin** → `can(manage, all)`
- **editor** → `read` all; `manage` content subjects (incl. `publish`); `update`
  own `User`; explicitly cannot create/delete users, change site settings, or
  manage social links.
- **viewer** → `read` all; `update` own `User`.

## Using it in a controller

```ts
@Controller('articles')
@UseGuards(PoliciesGuard)          // runs after the global JwtAuthGuard
export class ArticlesController {
  @Post()
  @CheckPolicies(can(Action.Create, 'Article'))
  create(@Body() dto: CreateArticleDto) { ... }

  @Patch(':id/publish')
  @CheckPolicies(can(Action.Publish, 'Article'))
  publish(@Param('id') id: string) { ... }
}
```

## Row / field-level checks

For per-record rules (e.g. a user editing only their own profile), tag the
record with CASL's `subject()` and test the ability directly:

```ts
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateUserDto,
  @UserAbility() ability: AppAbility,
) {
  if (!ability.can(Action.Update, subject('User', { id }))) {
    throw new ForbiddenException();
  }
  ...
}
```

The ability built for the request is also stored on `request.ability` by
`PoliciesGuard`, so services can reuse it.
