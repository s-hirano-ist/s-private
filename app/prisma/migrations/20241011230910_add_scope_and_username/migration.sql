/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "scope" "Scope" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
