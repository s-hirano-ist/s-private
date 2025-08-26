/*
  Warnings:

  - A unique constraint covering the columns `[id,user_id]` on the table `images` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "images_id_user_id_key" ON "public"."images"("id", "user_id");
