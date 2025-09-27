/*
  Warnings:

  - The primary key for the `st_books` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[isbn]` on the table `st_books` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `google_description` to the `st_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `google_href` to the `st_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `google_img_src` to the `st_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `google_subtitle` to the `st_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `google_title` to the `st_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isbn` to the `st_books` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "st_books_title_key";

-- AlterTable
ALTER TABLE "st_books" DROP CONSTRAINT "st_books_pkey",
ADD COLUMN     "google_authors" TEXT[],
ADD COLUMN     "google_description" TEXT NOT NULL,
ADD COLUMN     "google_href" TEXT NOT NULL,
ADD COLUMN     "google_img_src" TEXT NOT NULL,
ADD COLUMN     "google_subtitle" TEXT NOT NULL,
ADD COLUMN     "google_title" TEXT NOT NULL,
ADD COLUMN     "isbn" TEXT NOT NULL,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD CONSTRAINT "st_books_pkey" PRIMARY KEY ("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "st_books_isbn_key" ON "st_books"("isbn");
