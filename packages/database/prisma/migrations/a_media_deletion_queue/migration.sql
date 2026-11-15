-- CreateTable
CREATE TABLE "media_deletions" (
    "id" STRING(36) NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "domain" STRING(16) NOT NULL,
    "path" STRING(512) NOT NULL,
    "attempts" INT4 NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_token" STRING(36),
    "lease_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_deletions_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "media_object_locks" (
    "domain" STRING(16) NOT NULL,
    "path" STRING(512) NOT NULL,
    "token" STRING(36),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "media_object_locks_pkey" PRIMARY KEY ("domain","path")
) WITH (schema_locked = false);

-- CreateIndex
CREATE INDEX "media_deletions_next_attempt_at_lease_expires_at_idx" ON "media_deletions"("next_attempt_at", "lease_expires_at");
