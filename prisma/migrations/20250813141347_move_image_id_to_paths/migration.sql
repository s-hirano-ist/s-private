/*
  Warnings:

  - A unique constraint covering the columns `[paths,user_id]` on the table `images` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paths` to the `images` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."images_id_user_id_key";

-- AlterTable
ALTER TABLE "public"."images" ADD COLUMN     "paths" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "images_paths_user_id_key" ON "public"."images"("paths", "user_id");
