-- CreateTable
CREATE TABLE "st_images" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'UNEXPORTED',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "content_type" TEXT NOT NULL,
    "file_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,

    CONSTRAINT "st_images_pkey" PRIMARY KEY ("id")
);
