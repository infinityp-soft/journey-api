-- Rollback (DOWN) for 20260722000000_init.
-- Applied by: npm run migrate:down
-- Prisma Migrate is forward-only; this file is the explicit reverse of migration.sql.
-- Do NOT touch "_prisma_migrations" here — scripts/migrate-down.ts removes that row.

DROP TABLE IF EXISTS "social_links" CASCADE;
DROP TABLE IF EXISTS "site_settings" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;
DROP TABLE IF EXISTS "event_registrations" CASCADE;
DROP TABLE IF EXISTS "event_form_fields" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "videos" CASCADE;
DROP TABLE IF EXISTS "video_page_settings" CASCADE;
DROP TABLE IF EXISTS "testimonials" CASCADE;
DROP TABLE IF EXISTS "visa_documents" CASCADE;
DROP TABLE IF EXISTS "visa_services" CASCADE;
DROP TABLE IF EXISTS "articles" CASCADE;
DROP TABLE IF EXISTS "article_categories" CASCADE;
DROP TABLE IF EXISTS "destinations" CASCADE;
DROP TABLE IF EXISTS "staff_members" CASCADE;
DROP TABLE IF EXISTS "about_highlights" CASCADE;
DROP TABLE IF EXISTS "about_us" CASCADE;
DROP TABLE IF EXISTS "banners" CASCADE;
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "media_assets" CASCADE;

DROP TYPE IF EXISTS "FormFieldType";
DROP TYPE IF EXISTS "SocialPlatform";
DROP TYPE IF EXISTS "LeadTopic";
DROP TYPE IF EXISTS "LeadStatus";
DROP TYPE IF EXISTS "EventStatus";
DROP TYPE IF EXISTS "EventFormat";
DROP TYPE IF EXISTS "ReviewStatus";
DROP TYPE IF EXISTS "SimpleStatus";
DROP TYPE IF EXISTS "StaffStatus";
DROP TYPE IF EXISTS "PublishStatus";
DROP TYPE IF EXISTS "UserRole";
