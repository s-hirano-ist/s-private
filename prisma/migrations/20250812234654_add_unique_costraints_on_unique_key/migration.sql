/*
  Warnings:

  - A unique constraint covering the columns `[isbn,user_id]` on the table `books` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,user_id]` on the table `contents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url,user_id]` on the table `news` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."news_url_key";

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_user_id_key" ON "public"."books"("isbn", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contents_title_user_id_key" ON "public"."contents"("title", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_url_user_id_key" ON "public"."news"("url", "user_id");
