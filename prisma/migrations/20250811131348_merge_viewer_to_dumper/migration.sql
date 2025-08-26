/*
  Warnings:

  - You are about to drop the column `quote` on the `contents` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `contents` table. All the data in the column will be lost.
  - You are about to drop the `st_books` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `st_contents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `st_images` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `contents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `markdown` to the `contents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."contents" DROP COLUMN "quote",
DROP COLUMN "url",
ADD COLUMN     "exported_at" TIMESTAMP(3),
ADD COLUMN     "markdown" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."st_books";

-- DropTable
DROP TABLE "public"."st_contents";

-- DropTable
DROP TABLE "public"."st_images";

-- CreateTable
CREATE TABLE "public"."books" (
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "google_title" TEXT NOT NULL,
    "google_subtitle" TEXT NOT NULL,
    "google_authors" TEXT[],
    "google_description" TEXT NOT NULL,
    "google_img_src" TEXT NOT NULL,
    "google_href" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "rating" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."Status" NOT NULL DEFAULT 'UNEXPORTED',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("isbn")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "contents_title_key" ON "public"."contents"("title");
