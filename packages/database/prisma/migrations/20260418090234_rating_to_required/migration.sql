/*
  Warnings:

  - Made the column `rating` on table `books` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "books" ALTER COLUMN "rating" SET NOT NULL;
