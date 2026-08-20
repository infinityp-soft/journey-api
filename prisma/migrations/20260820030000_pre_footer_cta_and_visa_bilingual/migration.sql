-- UP: pre-footer CTA band on Global Settings + bilingual visa services

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "pre_footer_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pre_footer_title_en" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_title_th" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_description_en" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_description_th" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_cta_platform" "SocialPlatform",
  ADD COLUMN IF NOT EXISTS "pre_footer_cta_label_en" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_cta_label_th" TEXT,
  ADD COLUMN IF NOT EXISTS "pre_footer_cta_url" TEXT;

CREATE TABLE IF NOT EXISTS "pre_footer_highlights" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "site_settings_id" UUID NOT NULL,
  "text_en" TEXT,
  "text_th" TEXT,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pre_footer_highlights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pre_footer_highlights_site_settings_id_idx"
  ON "pre_footer_highlights" ("site_settings_id");

ALTER TABLE "pre_footer_highlights"
  DROP CONSTRAINT IF EXISTS "pre_footer_highlights_site_settings_id_fkey";
ALTER TABLE "pre_footer_highlights"
  ADD CONSTRAINT "pre_footer_highlights_site_settings_id_fkey"
  FOREIGN KEY ("site_settings_id") REFERENCES "site_settings" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Visa services become bilingual: existing single-language copy is kept as the
-- English column so no content is lost.
ALTER TABLE "visa_services" RENAME COLUMN "title" TO "title_en";
ALTER TABLE "visa_services" RENAME COLUMN "description_html" TO "description_html_en";
ALTER TABLE "visa_services"
  ADD COLUMN IF NOT EXISTS "title_th" TEXT,
  ADD COLUMN IF NOT EXISTS "description_html_th" TEXT;

CREATE INDEX IF NOT EXISTS "visa_services_status_idx"
  ON "visa_services" ("status");

ALTER TABLE "visa_documents" RENAME COLUMN "label" TO "label_en";
ALTER TABLE "visa_documents"
  ADD COLUMN IF NOT EXISTS "label_th" TEXT;
