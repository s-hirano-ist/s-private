/*
  Warnings:

  - You are about to drop the `contents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `news` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."news" DROP CONSTRAINT "news_category_id_fkey";

-- DropTable
DROP TABLE "public"."contents";

-- DropTable
DROP TABLE "public"."news";

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "quote" TEXT,
    "og_image_url" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "category_id" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_url_user_id_key" ON "public"."articles"("url", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notes_title_user_id_key" ON "public"."notes"("title", "user_id");

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
