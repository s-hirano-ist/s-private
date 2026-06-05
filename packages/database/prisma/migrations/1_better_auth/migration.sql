-- CreateTable
CREATE TABLE "user" (
    "id" STRING(64) NOT NULL,
    "name" STRING NOT NULL,
    "email" STRING NOT NULL,
    "email_verified" BOOL NOT NULL DEFAULT false,
    "image" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "session" (
    "id" STRING(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" STRING NOT NULL,
    "ip_address" STRING,
    "user_agent" STRING,
    "user_id" STRING(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "account" (
    "id" STRING(64) NOT NULL,
    "account_id" STRING(128) NOT NULL,
    "provider_id" STRING(64) NOT NULL,
    "user_id" STRING(64) NOT NULL,
    "access_token" STRING,
    "refresh_token" STRING,
    "id_token" STRING,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" STRING,
    "password" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "verification" (
    "id" STRING(64) NOT NULL,
    "identifier" STRING NOT NULL,
    "value" STRING NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
