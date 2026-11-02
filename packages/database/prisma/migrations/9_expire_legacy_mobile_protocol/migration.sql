-- Preserve legacy chunk locations before removing the old, non-atomic array.
INSERT INTO "mobile_upload_chunks" ("object_key", "upload_id", "writing_until")
SELECT concat('mobile-uploads/', uploads.id, '/', parts.part::STRING), uploads.id, NULL
FROM "mobile_uploads" AS uploads
CROSS JOIN LATERAL unnest(uploads.received_parts) AS parts(part)
WHERE uploads.protocol_version = 1
ON CONFLICT ("object_key") DO NOTHING;

-- Retain successful operations and all content/sync records unchanged.
UPDATE "mobile_operations"
SET "status" = 'FAILED', "error_code" = 'OPERATION_EXPIRED',
    "lease_token" = NULL, "lease_expires_at" = NULL
WHERE "protocol_version" = 1 AND "status" <> 'SUCCEEDED';

UPDATE "mobile_uploads"
SET "state" = 'EXPIRED', "expires_at" = LEAST("expires_at", CURRENT_TIMESTAMP),
    "lease_token" = NULL, "lease_expires_at" = NULL
WHERE "protocol_version" = 1;

-- AlterTable
ALTER TABLE "mobile_uploads" DROP COLUMN "received_parts";

