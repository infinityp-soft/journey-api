-- Rollback for 20261124000000_article_pinned_published_date (published_at backfill is kept).
ALTER TABLE "articles" DROP COLUMN IF EXISTS "is_pinned";
