CREATE TYPE "MobileOperationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "mobile_operations" (
  "id" STRING(36) NOT NULL,
  "user_id" STRING(128) NOT NULL,
  "domain" STRING(16) NOT NULL,
  "input_hash" STRING(64) NOT NULL,
  "status" "MobileOperationStatus" NOT NULL DEFAULT 'PENDING',
  "resource_id" STRING(36),
  "error_code" STRING(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mobile_operations_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);
CREATE UNIQUE INDEX "mobile_operations_user_id_id_key" ON "mobile_operations"("user_id", "id");
CREATE INDEX "mobile_operations_user_id_status_idx" ON "mobile_operations"("user_id", "status");

CREATE TABLE "mobile_uploads" (
  "id" STRING(36) NOT NULL,
  "operation_id" STRING(36) NOT NULL,
  "user_id" STRING(128) NOT NULL,
  "domain" STRING(16) NOT NULL,
  "content_type" STRING(64) NOT NULL,
  "file_size" INT4 NOT NULL,
  "metadata" JSONB NOT NULL,
  "received_parts" INT4[] NOT NULL DEFAULT ARRAY[]::INT4[],
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mobile_uploads_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);
CREATE UNIQUE INDEX "mobile_uploads_user_id_operation_id_key" ON "mobile_uploads"("user_id", "operation_id");
CREATE INDEX "mobile_uploads_expires_at_idx" ON "mobile_uploads"("expires_at");
