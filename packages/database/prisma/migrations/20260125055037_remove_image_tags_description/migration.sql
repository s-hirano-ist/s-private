/*
  Warnings:

  - You are about to drop the column `description` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "images" DROP COLUMN "description",
DROP COLUMN "tags";
