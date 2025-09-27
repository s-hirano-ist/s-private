/*
  Warnings:

  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."news" DROP CONSTRAINT "news_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."books" ALTER COLUMN "google_title" DROP NOT NULL,
ALTER COLUMN "google_subtitle" DROP NOT NULL,
ALTER COLUMN "google_description" DROP NOT NULL,
ALTER COLUMN "google_img_src" DROP NOT NULL,
ALTER COLUMN "google_href" DROP NOT NULL,
ALTER COLUMN "markdown" DROP NOT NULL,
ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "categories_id_seq";

-- AlterTable
ALTER TABLE "public"."contents" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."images" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."news" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "category_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."news" ADD CONSTRAINT "news_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
