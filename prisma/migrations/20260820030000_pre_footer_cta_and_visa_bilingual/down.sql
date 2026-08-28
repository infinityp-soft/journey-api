-- DOWN: drop the pre-footer CTA band and collapse visa services back to one
-- language. Thai visa copy entered after the UP migration is discarded.

ALTER TABLE "visa_documents"
  DROP COLUMN IF EXISTS "label_th";
ALTER TABLE "visa_documents" RENAME COLUMN "label_en" TO "label";

DROP INDEX IF EXISTS "visa_services_status_idx";

ALTER TABLE "visa_services"
  DROP COLUMN IF EXISTS "title_th",
  DROP COLUMN IF EXISTS "description_html_th";
ALTER TABLE "visa_services" RENAME COLUMN "title_en" TO "title";
ALTER TABLE "visa_services" RENAME COLUMN "description_html_en" TO "description_html";

DROP TABLE IF EXISTS "pre_footer_highlights";

ALTER TABLE "site_settings"
  DROP COLUMN IF EXISTS "pre_footer_enabled",
  DROP COLUMN IF EXISTS "pre_footer_title_en",
  DROP COLUMN IF EXISTS "pre_footer_title_th",
  DROP COLUMN IF EXISTS "pre_footer_description_en",
  DROP COLUMN IF EXISTS "pre_footer_description_th",
  DROP COLUMN IF EXISTS "pre_footer_cta_platform",
  DROP COLUMN IF EXISTS "pre_footer_cta_label_en",
  DROP COLUMN IF EXISTS "pre_footer_cta_label_th",
  DROP COLUMN IF EXISTS "pre_footer_cta_url";
