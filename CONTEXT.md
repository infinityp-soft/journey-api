# Journey API context

## Current Status
- 2026-10-28: migration `20261028120000_article_page_settings` adds the `article_page_settings` singleton (cover image for the public Articles page) with `GET /articles/page-settings/public`, `GET/PATCH /articles/page-settings` (CASL subject `ArticlePageSettings`, editor-manageable) and media GC reference.
- Trello retest 2026-10-28 (evening): 14 cards had been returned to Process; 10 passed and moved to Check, the remaining 4 were fixed locally (below) and await retest. Changes are local working-tree edits; not committed, pushed or deployed.
- 2026-10-28: migration `20261028000000_article_destinations_views_cta_body` adds optional article destination, indexed foreign key with SET NULL, atomic article view counter, and bilingual CTA body copy.
- Public articles accept destinationId and return all published/visible candidates for frontend search/pagination. POST `/articles/public/:slug/views` counts only published visible articles; ordinary reads/metadata do not change counters.
- Admin article DTOs accept nullable destinationId for assignment/removal. Response DTOs document the new fields.
- Build/typecheck, clean database migration deploy, rollback SQL inside a rolled-back transaction, and authenticated API regression script passed using a disposable local PostgreSQL container.
- Integration fixtures are synthetic and exist only in the temporary test database/media directory, outside production.

## Pending Tasks / Next Steps
- Deploy API migration `20261028120000_article_page_settings` (new `article_page_settings` singleton) together with these changes.
- Apply migration through the normal deployment process before shipping frontend/admin changes.
- No production database or remote service was migrated/deployed.
