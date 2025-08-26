/*
  Warnings:

  - You are about to drop the column `verified` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'UNAUTHORIZED';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "verified";
