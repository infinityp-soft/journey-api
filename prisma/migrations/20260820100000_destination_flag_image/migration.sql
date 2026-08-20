-- UP: country flag image on destinations (separate from the cover image)

ALTER TABLE "destinations"
  ADD COLUMN IF NOT EXISTS "flag_image_id" UUID;

ALTER TABLE "destinations"
  DROP CONSTRAINT IF EXISTS "destinations_flag_image_id_fkey";
ALTER TABLE "destinations"
  ADD CONSTRAINT "destinations_flag_image_id_fkey"
  FOREIGN KEY ("flag_image_id") REFERENCES "media_assets" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
