-- Admin-editable hero title (EN/TH) for the public Articles page, like event_page_settings.
ALTER TABLE "article_page_settings" ADD COLUMN "page_title_en" TEXT;
ALTER TABLE "article_page_settings" ADD COLUMN "page_title_th" TEXT;
