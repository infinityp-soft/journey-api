-- AlterTable
ALTER TABLE "social_links" ADD COLUMN     "icon_id" UUID;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_icon_id_fkey" FOREIGN KEY ("icon_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

