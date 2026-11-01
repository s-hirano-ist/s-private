-- AlterTable
ALTER TABLE "mobile_operations" ADD COLUMN     "lease_expires_at" TIMESTAMP(3);
ALTER TABLE "mobile_operations" ADD COLUMN     "lease_token" STRING(36);
ALTER TABLE "mobile_operations" ADD COLUMN     "protocol_version" INT4 NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "mobile_uploads" ADD COLUMN     "lease_expires_at" TIMESTAMP(3);
ALTER TABLE "mobile_uploads" ADD COLUMN     "lease_token" STRING(36);
ALTER TABLE "mobile_uploads" ADD COLUMN     "protocol_version" INT4 NOT NULL DEFAULT 1;
ALTER TABLE "mobile_uploads" ADD COLUMN     "resource_id" STRING(36);
ALTER TABLE "mobile_uploads" ADD COLUMN     "revision" INT4 NOT NULL DEFAULT 0;
ALTER TABLE "mobile_uploads" ADD COLUMN     "state" STRING(16) NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "mobile_upload_parts" (
    "upload_id" STRING(36) NOT NULL,
    "part" INT4 NOT NULL,
    "hash" STRING(64) NOT NULL,
    "size" INT4 NOT NULL,
    "object_key" STRING NOT NULL,

    CONSTRAINT "mobile_upload_parts_pkey" PRIMARY KEY ("upload_id","part")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "mobile_upload_chunks" (
    "object_key" STRING NOT NULL,
    "upload_id" STRING(36) NOT NULL,
    "writing_until" TIMESTAMP(3),

    CONSTRAINT "mobile_upload_chunks_pkey" PRIMARY KEY ("object_key")
) WITH (schema_locked = false);

-- AddForeignKey
ALTER TABLE "mobile_upload_parts" ADD CONSTRAINT "mobile_upload_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "mobile_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_upload_chunks" ADD CONSTRAINT "mobile_upload_chunks_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "mobile_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing records keep protocol 1; only new requests use the lease protocol.
ALTER TABLE "mobile_operations" ALTER COLUMN "protocol_version" SET DEFAULT 2;
ALTER TABLE "mobile_uploads" ALTER COLUMN "protocol_version" SET DEFAULT 2;
