/*
  Warnings:

  - The primary key for the `articles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `title` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `url` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `quote` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `og_image_url` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `og_title` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `og_description` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1024)`.
  - You are about to alter the column `category_id` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `articles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - The primary key for the `books` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `isbn` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(17)`.
  - You are about to alter the column `title` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `google_title` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `google_subtitle` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `google_img_src` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `google_href` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `user_id` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `id` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `image_path` on the `books` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - You are about to alter the column `user_id` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - The primary key for the `images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `content_type` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `description` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1024)`.
  - You are about to alter the column `path` on the `images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - The primary key for the `notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `notes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `title` on the `notes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `user_id` on the `notes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.

*/
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_category_id_fkey";

-- AlterTable
ALTER TABLE "articles" DROP CONSTRAINT "articles_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "quote" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "og_image_url" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "og_title" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "og_description" SET DATA TYPE VARCHAR(1024),
ALTER COLUMN "category_id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(128),
ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "books" DROP CONSTRAINT "books_pkey",
ALTER COLUMN "isbn" SET DATA TYPE VARCHAR(17),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "google_title" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "google_subtitle" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "google_img_src" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "google_href" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "image_path" SET DATA TYPE VARCHAR(512),
ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "categories" DROP CONSTRAINT "categories_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(16),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(128),
ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "images" DROP CONSTRAINT "images_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "content_type" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1024),
ALTER COLUMN "path" SET DATA TYPE VARCHAR(512),
ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notes" DROP CONSTRAINT "notes_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(128),
ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
