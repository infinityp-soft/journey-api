-- Pinned articles show first on the public site; the rest are ordered by published_at,
-- which the admin can now set (e.g. back-dated news).
ALTER TABLE "articles" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- Published articles without a date would sort last: give them their creation date.
UPDATE "articles" SET "published_at" = "created_at" WHERE "status" = 'published' AND "published_at" IS NULL;
