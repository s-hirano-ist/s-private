/*
  Warnings:

  - You are about to drop the column `scope` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "scope";

-- DropEnum
DROP TYPE "Scope";
