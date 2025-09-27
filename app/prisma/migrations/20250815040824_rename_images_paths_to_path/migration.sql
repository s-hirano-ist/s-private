/*
  Warnings:

  - You are about to drop the column `paths` on the `images` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[path,user_id]` on the table `images` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `images` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."images_paths_user_id_key";

-- AlterTable
ALTER TABLE "public"."images" DROP COLUMN "paths",
ADD COLUMN     "path" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "images_path_user_id_key" ON "public"."images"("path", "user_id");
