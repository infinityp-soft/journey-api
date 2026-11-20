-- Admin-editable hero title (EN/TH) for the public Events page, like video_page_settings.
ALTER TABLE "event_page_settings" ADD COLUMN "page_title_en" TEXT;
ALTER TABLE "event_page_settings" ADD COLUMN "page_title_th" TEXT;
