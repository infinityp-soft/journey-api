# Journey API context

## Current Status
- 2026-10-28 optimize: uploads are capped to 1920px longest edge at WebP q82 (`MAX_IMAGE_DIMENSION`); one-off `node dist/cli/optimize-media.js [--apply]` re-encodes older large media in place (same keys). Public article responses expose only author `id`/`name` (no e-mail/role).
- 2026-10-28 performance: production lists were 23 MB (destinations) / 9.5 MB (articles) / 5.5 MB (events) because old editor content embeds base64 images. Public list endpoints now omit `content*` (destinations, articles) and return a 300-char plain-text `description*` summary (events); detail endpoints are unchanged. New one-off CLI `node dist/cli/extract-inline-images.js [--apply]` moves `data:image` images into media (WebP) and rewrites HTML to `/media/...` (see deploy/README.md). Media GC now also keeps assets referenced inside rich-text HTML (`RICH_TEXT_COLUMNS`) — previously editor-inserted images were purged after 24h.
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
