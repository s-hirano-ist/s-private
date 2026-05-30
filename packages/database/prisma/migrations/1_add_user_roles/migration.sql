-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'DUMPER');

-- CreateTable
CREATE TABLE "users" (
    "id" STRING(128) NOT NULL,
    "roles" "Role"[],
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

