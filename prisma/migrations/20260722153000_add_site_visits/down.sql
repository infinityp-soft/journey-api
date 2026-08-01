-- DOWN: remove site_visits counter
ALTER TABLE "site_settings"
  DROP COLUMN IF EXISTS "site_visits";
