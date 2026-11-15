-- CreateTable
CREATE TABLE "rss_feeds" (
    "id" UUID NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "url" STRING(2048) NOT NULL,
    "title" STRING(512) NOT NULL,
    "folder" STRING(512) NOT NULL,
    "last_fetched_at" TIMESTAMP(3),
    "etag" STRING(1024),
    "last_modified" STRING(128),
    "error" STRING(64),
    "lease_token" UUID,
    "lease_expires_at" TIMESTAMP(3),

    CONSTRAINT "rss_feeds_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "rss_unread" (
    "id" UUID NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "feed_id" UUID NOT NULL,
    "url" STRING(2048) NOT NULL,
    "title" STRING(512) NOT NULL,
    "published_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_unread_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "rss_seen" (
    "feed_id" UUID NOT NULL,
    "hash" BYTES NOT NULL,

    CONSTRAINT "rss_seen_pkey" PRIMARY KEY ("feed_id","hash")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "rss_saved" (
    "id" UUID NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "url" STRING(2048) NOT NULL,
    "title" STRING(512) NOT NULL,
    "published_at" TIMESTAMP(3),
    "saved_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_saved_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateIndex
CREATE UNIQUE INDEX "rss_feeds_user_id_url_key" ON "rss_feeds"("user_id", "url");

-- CreateIndex
CREATE INDEX "rss_unread_user_id_received_at_id_idx" ON "rss_unread"("user_id", "received_at", "id");

-- CreateIndex
CREATE INDEX "rss_unread_feed_id_idx" ON "rss_unread"("feed_id");

-- CreateIndex
CREATE INDEX "rss_saved_user_id_saved_at_id_idx" ON "rss_saved"("user_id", "saved_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "rss_saved_user_id_url_key" ON "rss_saved"("user_id", "url");

-- AddForeignKey
ALTER TABLE "rss_unread" ADD CONSTRAINT "rss_unread_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "rss_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rss_seen" ADD CONSTRAINT "rss_seen_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "rss_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
