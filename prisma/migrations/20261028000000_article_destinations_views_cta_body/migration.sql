ALTER TABLE "articles" ADD COLUMN "destination_id" UUID, ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "articles_destination_id_idx" ON "articles"("destination_id");
ALTER TABLE "articles" ADD CONSTRAINT "articles_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD COLUMN "pre_footer_body_en" TEXT, ADD COLUMN "pre_footer_body_th" TEXT;
