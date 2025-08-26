-- AlterTable
ALTER TABLE "public"."articles" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."books" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."categories" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."images" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."notes" ALTER COLUMN "created_at" DROP DEFAULT;
