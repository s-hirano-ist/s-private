-- CreateIndex
CREATE INDEX "rss_unread_user_id_feed_id_received_at_id_idx" ON "rss_unread"("user_id", "feed_id", "received_at", "id");

