-- Init migration (UP) for Journey Education Admin CMS.
-- Matches prisma/schema.prisma. A hand-written rollback lives in down.sql.
-- gen_random_uuid() is core in PostgreSQL 13+; pgcrypto ensures older builds too.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE "PublishStatus" AS ENUM ('draft', 'pending', 'published', 'archived');
CREATE TYPE "StaffStatus" AS ENUM ('active', 'on_leave', 'inactive');
CREATE TYPE "SimpleStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'published', 'hidden');
CREATE TYPE "EventFormat" AS ENUM ('online', 'offline');
CREATE TYPE "EventStatus" AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'closed');
CREATE TYPE "LeadTopic" AS ENUM ('international_undergraduate', 'postgraduate_programs', 'scholarship_inquiry', 'visa_assistance', 'other');
CREATE TYPE "SocialPlatform" AS ENUM ('facebook', 'instagram', 'line', 'youtube', 'tiktok', 'twitter', 'linkedin', 'other');
CREATE TYPE "FormFieldType" AS ENUM ('text', 'email', 'phone', 'select', 'textarea', 'date', 'number', 'checkbox');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "checksum_sha256" CHAR(64),
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "avatar_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "link_url" TEXT,
    "image_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "about_us" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_title_en" TEXT,
    "company_title_th" TEXT,
    "bio_en" TEXT,
    "bio_th" TEXT,
    "team_page_title_en" TEXT,
    "team_page_title_th" TEXT,
    "team_header_image_id" UUID,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "about_us_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "about_highlights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "about_us_id" UUID NOT NULL,
    "title_en" TEXT,
    "title_th" TEXT,
    "description_en" TEXT,
    "description_th" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "about_highlights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name_en" TEXT NOT NULL,
    "full_name_th" TEXT,
    "position_en" TEXT,
    "position_th" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "photo_id" UUID,
    "status" "StaffStatus" NOT NULL DEFAULT 'active',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "destinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_en" TEXT NOT NULL,
    "name_th" TEXT,
    "short_desc_en" TEXT,
    "short_desc_th" TEXT,
    "content_en" TEXT,
    "content_th" TEXT,
    "cover_image_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "article_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_en" TEXT NOT NULL,
    "name_th" TEXT,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title_en" TEXT NOT NULL,
    "title_th" TEXT,
    "slug" TEXT NOT NULL,
    "excerpt_en" TEXT,
    "excerpt_th" TEXT,
    "content_en" TEXT,
    "content_th" TEXT,
    "category_id" UUID,
    "author_id" UUID,
    "author_name" TEXT,
    "featured_image_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "read_time_minutes" INTEGER,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visa_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "country" TEXT,
    "description_html" TEXT,
    "header_image_id" UUID,
    "status" "SimpleStatus" NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visa_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visa_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "visa_service_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "visa_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "testimonials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_name_en" TEXT NOT NULL,
    "student_name_th" TEXT,
    "location_en" TEXT,
    "location_th" TEXT,
    "counselor_id" UUID,
    "content_en" TEXT,
    "content_th" TEXT,
    "rating" SMALLINT,
    "portrait_image_id" UUID,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_page_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_title_en" TEXT,
    "page_title_th" TEXT,
    "header_image_id" UUID,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "video_page_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title_en" TEXT,
    "title_th" TEXT,
    "youtube_url" TEXT NOT NULL,
    "thumbnail_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'published',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_en" TEXT NOT NULL,
    "name_th" TEXT,
    "format" "EventFormat" NOT NULL DEFAULT 'online',
    "venue_en" TEXT,
    "venue_th" TEXT,
    "online_url" TEXT,
    "max_registrants" INTEGER,
    "description_en" TEXT,
    "description_th" TEXT,
    "cover_image_id" UUID,
    "event_start_at" TIMESTAMPTZ(6),
    "event_end_at" TIMESTAMPTZ(6),
    "registration_open_at" TIMESTAMPTZ(6),
    "registration_close_at" TIMESTAMPTZ(6),
    "registration_form_enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_form_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_th" TEXT,
    "field_type" "FormFieldType" NOT NULL DEFAULT 'text',
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "event_form_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "area_of_interest" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_code" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "interest_country" TEXT,
    "planned_year" INTEGER,
    "duration" TEXT,
    "degree_level" TEXT,
    "topic" "LeadTopic" NOT NULL DEFAULT 'other',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_cover_image_id" UUID,
    "contact_title_en" TEXT,
    "contact_title_th" TEXT,
    "address_en" TEXT,
    "address_th" TEXT,
    "primary_phone" TEXT,
    "inquiry_email" TEXT,
    "google_map_link" TEXT,
    "logo_id" UUID,
    "footer_bio_en" TEXT,
    "footer_bio_th" TEXT,
    "default_seo_title" TEXT,
    "default_seo_description" TEXT,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Unique indexes
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets" ("storage_key");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens" ("token_hash");
CREATE UNIQUE INDEX "about_us_is_singleton_key" ON "about_us" ("is_singleton");
CREATE UNIQUE INDEX "article_categories_slug_key" ON "article_categories" ("slug");
CREATE UNIQUE INDEX "articles_slug_key" ON "articles" ("slug");
CREATE UNIQUE INDEX "video_page_settings_is_singleton_key" ON "video_page_settings" ("is_singleton");
CREATE UNIQUE INDEX "leads_lead_code_key" ON "leads" ("lead_code");
CREATE UNIQUE INDEX "site_settings_is_singleton_key" ON "site_settings" ("is_singleton");

-- ---------------------------------------------------------------------------
-- Secondary indexes
-- ---------------------------------------------------------------------------
CREATE INDEX "users_role_idx" ON "users" ("role");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" ("created_at");
CREATE INDEX "banners_sort_order_idx" ON "banners" ("sort_order");
CREATE INDEX "about_highlights_about_us_id_idx" ON "about_highlights" ("about_us_id");
CREATE INDEX "staff_members_status_idx" ON "staff_members" ("status");
CREATE INDEX "staff_members_sort_order_idx" ON "staff_members" ("sort_order");
CREATE INDEX "destinations_status_idx" ON "destinations" ("status");
CREATE INDEX "destinations_sort_order_idx" ON "destinations" ("sort_order");
CREATE INDEX "articles_status_idx" ON "articles" ("status");
CREATE INDEX "articles_category_id_idx" ON "articles" ("category_id");
CREATE INDEX "articles_published_at_idx" ON "articles" ("published_at");
CREATE INDEX "visa_services_sort_order_idx" ON "visa_services" ("sort_order");
CREATE INDEX "visa_documents_visa_service_id_idx" ON "visa_documents" ("visa_service_id");
CREATE INDEX "testimonials_status_idx" ON "testimonials" ("status");
CREATE INDEX "videos_sort_order_idx" ON "videos" ("sort_order");
CREATE INDEX "events_status_idx" ON "events" ("status");
CREATE INDEX "events_event_start_at_idx" ON "events" ("event_start_at");
CREATE INDEX "event_form_fields_event_id_idx" ON "event_form_fields" ("event_id");
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations" ("event_id");
CREATE INDEX "event_registrations_email_idx" ON "event_registrations" ("email");
CREATE INDEX "leads_status_idx" ON "leads" ("status");
CREATE INDEX "leads_topic_idx" ON "leads" ("topic");
CREATE INDEX "leads_submitted_at_idx" ON "leads" ("submitted_at");
CREATE INDEX "social_links_sort_order_idx" ON "social_links" ("sort_order");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "banners" ADD CONSTRAINT "banners_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "about_us" ADD CONSTRAINT "about_us_team_header_image_id_fkey" FOREIGN KEY ("team_header_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "about_highlights" ADD CONSTRAINT "about_highlights_about_us_id_fkey" FOREIGN KEY ("about_us_id") REFERENCES "about_us" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_featured_image_id_fkey" FOREIGN KEY ("featured_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "visa_services" ADD CONSTRAINT "visa_services_header_image_id_fkey" FOREIGN KEY ("header_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "visa_documents" ADD CONSTRAINT "visa_documents_visa_service_id_fkey" FOREIGN KEY ("visa_service_id") REFERENCES "visa_services" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "staff_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_portrait_image_id_fkey" FOREIGN KEY ("portrait_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "video_page_settings" ADD CONSTRAINT "video_page_settings_header_image_id_fkey" FOREIGN KEY ("header_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "event_form_fields" ADD CONSTRAINT "event_form_fields_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_contact_cover_image_id_fkey" FOREIGN KEY ("contact_cover_image_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Singleton seed rows (idempotent; unique on is_singleton)
-- ---------------------------------------------------------------------------
INSERT INTO "about_us" ("is_singleton", "updated_at") VALUES (true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO "video_page_settings" ("is_singleton", "updated_at") VALUES (true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO "site_settings" ("is_singleton", "updated_at") VALUES (true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
