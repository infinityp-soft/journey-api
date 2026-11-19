-- The admin's "show on website" switch now sets status (Active/Inactive) and the
-- website lists Active staff only. Staff hidden with the old switch stay hidden.
UPDATE "staff_members" SET "status" = 'inactive' WHERE "is_visible" = false AND "status" = 'active';
