# Journey API context

## Current Status
- Trello verified after transfer: Process **0**, Check **33**. Changes are local working-tree edits; not committed, pushed or deployed.
- 2026-10-28: migration `20261028000000_article_destinations_views_cta_body` adds optional article destination, indexed foreign key with SET NULL, atomic article view counter, and bilingual CTA body copy.
- Public articles accept destinationId and return all published/visible candidates for frontend search/pagination. POST `/articles/public/:slug/views` counts only published visible articles; ordinary reads/metadata do not change counters.
- Admin article DTOs accept nullable destinationId for assignment/removal. Response DTOs document the new fields.
- Build/typecheck, clean database migration deploy, rollback SQL inside a rolled-back transaction, and authenticated API regression script passed using a disposable local PostgreSQL container.
- Integration fixtures are synthetic and exist only in the temporary test database/media directory, outside production.

## Pending Tasks / Next Steps
- Apply migration through the normal deployment process before shipping frontend/admin changes.
- No production database or remote service was migrated/deployed.
