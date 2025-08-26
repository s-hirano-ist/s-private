-- CreateTable
CREATE TABLE "st_contents" (
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "uint8ArrayImage" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "st_contents_pkey" PRIMARY KEY ("title")
);

-- CreateTable
CREATE TABLE "st_books" (
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "uint8ArrayImage" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "st_books_pkey" PRIMARY KEY ("title")
);

-- CreateIndex
CREATE UNIQUE INDEX "st_contents_title_key" ON "st_contents"("title");

-- CreateIndex
CREATE UNIQUE INDEX "st_books_title_key" ON "st_books"("title");
