/*
  Warnings:

  - The values [UPDATED_RECENTLY] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deleted_at` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `news` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `news` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Status_new" AS ENUM ('UNEXPORTED', 'EXPORTED');
ALTER TABLE "public"."contents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."images" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."news" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."news" ALTER COLUMN "status" TYPE "public"."Status_new" USING ("status"::text::"public"."Status_new");
ALTER TABLE "public"."contents" ALTER COLUMN "status" TYPE "public"."Status_new" USING ("status"::text::"public"."Status_new");
ALTER TABLE "public"."images" ALTER COLUMN "status" TYPE "public"."Status_new" USING ("status"::text::"public"."Status_new");
ALTER TYPE "public"."Status" RENAME TO "Status_old";
ALTER TYPE "public"."Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "public"."contents" ALTER COLUMN "status" SET DEFAULT 'UNEXPORTED';
ALTER TABLE "public"."images" ALTER COLUMN "status" SET DEFAULT 'UNEXPORTED';
ALTER TABLE "public"."news" ALTER COLUMN "status" SET DEFAULT 'UNEXPORTED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."images" DROP COLUMN "deleted_at",
ADD COLUMN     "exported_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."news" DROP COLUMN "userId",
ADD COLUMN     "exported_at" TIMESTAMP(3),
ADD COLUMN     "user_id" TEXT NOT NULL;
