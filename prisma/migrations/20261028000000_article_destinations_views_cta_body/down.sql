ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_destination_id_fkey";
DROP INDEX IF EXISTS "articles_destination_id_idx";
ALTER TABLE "articles" DROP COLUMN IF EXISTS "destination_id", DROP COLUMN IF EXISTS "view_count";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "pre_footer_body_en", DROP COLUMN IF EXISTS "pre_footer_body_th";
