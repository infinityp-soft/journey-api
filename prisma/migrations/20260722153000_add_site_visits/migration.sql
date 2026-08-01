-- UP: add site_visits counter for Dashboard "Site Visits" card
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "site_visits" INTEGER NOT NULL DEFAULT 0;
