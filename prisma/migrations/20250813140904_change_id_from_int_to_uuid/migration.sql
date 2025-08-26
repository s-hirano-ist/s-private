/*
  Warnings:

  - The primary key for the `books` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `contents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `news` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `books` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."books" DROP CONSTRAINT "books_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."contents" DROP CONSTRAINT "contents_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "contents_id_seq";

-- AlterTable
ALTER TABLE "public"."news" DROP CONSTRAINT "news_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "news_id_seq";
