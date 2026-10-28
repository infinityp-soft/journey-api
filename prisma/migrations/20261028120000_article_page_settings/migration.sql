CREATE TABLE "article_page_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "header_image_id" UUID,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_page_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "article_page_settings_is_singleton_key" ON "article_page_settings"("is_singleton");
ALTER TABLE "article_page_settings" ADD CONSTRAINT "article_page_settings_header_image_id_fkey" FOREIGN KEY ("header_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "article_page_settings" ("is_singleton", "updated_at") VALUES (true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
