/*
  Warnings:

  - You are about to drop the `login_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contents" DROP CONSTRAINT "contents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "images" DROP CONSTRAINT "images_user_id_fkey";

-- DropForeignKey
ALTER TABLE "login_histories" DROP CONSTRAINT "login_histories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_userId_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_user_id_fkey";

-- DropTable
DROP TABLE "login_histories";

-- DropTable
DROP TABLE "profiles";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "Role";
