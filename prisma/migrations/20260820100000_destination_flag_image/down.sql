-- DOWN: remove the destination country flag image

ALTER TABLE "destinations"
  DROP CONSTRAINT IF EXISTS "destinations_flag_image_id_fkey";
ALTER TABLE "destinations"
  DROP COLUMN IF EXISTS "flag_image_id";
