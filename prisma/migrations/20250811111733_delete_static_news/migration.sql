/*
  Warnings:

  - You are about to drop the `st_news` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[url]` on the table `news` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."st_news" DROP CONSTRAINT "st_news_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."news" ADD COLUMN     "og_description" TEXT,
ADD COLUMN     "og_image_url" TEXT,
ADD COLUMN     "og_title" TEXT;

-- DropTable
DROP TABLE "public"."st_news";

-- CreateIndex
CREATE UNIQUE INDEX "news_url_key" ON "public"."news"("url");
