CREATE TABLE "event_page_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "header_image_id" UUID,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_page_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_page_settings_is_singleton_key" ON "event_page_settings"("is_singleton");
ALTER TABLE "event_page_settings" ADD CONSTRAINT "event_page_settings_header_image_id_fkey" FOREIGN KEY ("header_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "event_page_settings" ("is_singleton", "updated_at") VALUES (true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
