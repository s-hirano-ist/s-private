/*
  Warnings:

  - Column `title` length expanded from VARCHAR(256) to VARCHAR(512) to accommodate Google Books API titles.
  - Column `google_title` on table `books` will be dropped. Values are merged into `title` (Google Books value takes precedence when present).

*/
-- AlterTable
ALTER TABLE "books" ALTER COLUMN "title" TYPE VARCHAR(512);

-- Backfill: prefer google_title when present
UPDATE "books" SET "title" = "google_title" WHERE "google_title" IS NOT NULL AND "google_title" <> '';

-- DropColumn
ALTER TABLE "books" DROP COLUMN "google_title";
