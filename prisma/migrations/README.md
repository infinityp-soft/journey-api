# Prisma migrations — up / down

Prisma Migrate is **forward-only**. We keep a hand-written `down.sql` next to
each `migration.sql` so rollbacks stay explicit and reviewable.

```
prisma/migrations/
  migration_lock.toml
  20260722000000_init/
    migration.sql   ← UP   (applied by `prisma migrate deploy`)
    down.sql        ← DOWN (applied by `npm run migrate:down`)
```

## Commands

| Script | What it does |
|---|---|
| `npm run migrate:up` | Apply every pending `migration.sql` (`prisma migrate deploy`) |
| `npm run migrate:down` | Run the latest migration's `down.sql`, then remove its `_prisma_migrations` row |
| `npm run migrate:down -- --steps=2` | Roll back the last N applied migrations |
| `npm run migrate:dev` | Create + apply a new migration in development |
| `npm run migrate:new` | Scaffold a new migration SQL without applying it |
| `npm run migrate:reset` | Drop DB, re-apply all ups, run seed (dev only) |

## Writing a new migration

1. Edit `prisma/schema.prisma`.
2. Scaffold: `npm run migrate:new -- --name add_foo_column`
3. Review / edit the generated `migration.sql` (the **up** step).
4. Add a matching `down.sql` in the same folder that reverses the change.
5. Apply: `npm run migrate:up`.

## Rules for `down.sql`

- Must fully reverse the matching `migration.sql`.
- Prefer `DROP … IF EXISTS` / `ALTER … DROP COLUMN IF EXISTS` so re-runs are safe.
- Do **not** touch `_prisma_migrations` — `scripts/migrate-down.ts` does that.
- Keep the down step in the same transaction as the history delete (the script wraps both in `BEGIN`/`COMMIT`).
