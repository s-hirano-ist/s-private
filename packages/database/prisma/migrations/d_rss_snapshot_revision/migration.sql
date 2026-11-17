-- AlterTable
ALTER TABLE "rss_unread" ADD COLUMN     "revision" INT4 NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "rss_states" (
    "user_id" STRING(128) NOT NULL,
    "revision" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "rss_states_pkey" PRIMARY KEY ("user_id")
) WITH (schema_locked = false);

