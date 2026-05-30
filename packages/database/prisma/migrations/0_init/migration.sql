-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('UNEXPORTED', 'LAST_UPDATED', 'EXPORTED');

-- CreateTable
CREATE TABLE "categories" (
    "id" STRING(36) NOT NULL,
    "name" STRING(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" STRING(128) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "articles" (
    "id" STRING(36) NOT NULL,
    "title" STRING(128) NOT NULL,
    "url" STRING(2048) NOT NULL,
    "quote" STRING(512),
    "og_image_url" STRING(4096),
    "og_title" STRING(512),
    "og_description" STRING(1024),
    "category_id" STRING(36) NOT NULL,
    "status" "Status" NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "notes" (
    "id" STRING(36) NOT NULL,
    "title" STRING(64) NOT NULL,
    "markdown" STRING NOT NULL,
    "status" "Status" NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "images" (
    "id" STRING(36) NOT NULL,
    "path" STRING(512) NOT NULL,
    "content_type" STRING(32) NOT NULL,
    "file_size" INT4,
    "width" INT4,
    "height" INT4,
    "status" "Status" NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateTable
CREATE TABLE "books" (
    "id" STRING(36) NOT NULL,
    "isbn" STRING(17) NOT NULL,
    "title" STRING(512) NOT NULL,
    "google_subtitle" STRING(512),
    "google_authors" STRING[],
    "google_description" STRING,
    "google_img_src" STRING(2048),
    "google_href" STRING(2048),
    "image_path" STRING(512),
    "markdown" STRING,
    "rating" INT4 NOT NULL,
    "tags" STRING[],
    "status" "Status" NOT NULL,
    "user_id" STRING(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "exported_at" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
) WITH (schema_locked = false);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_user_id_key" ON "categories"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_url_user_id_key" ON "articles"("url", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notes_title_user_id_key" ON "notes"("title", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "images_path_user_id_key" ON "images"("path", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_user_id_key" ON "books"("isbn", "user_id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
