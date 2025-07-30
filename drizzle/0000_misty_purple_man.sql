CREATE TYPE "public"."Status" AS ENUM('UNEXPORTED', 'UPDATED_RECENTLY', 'EXPORTED');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "categories_name_user_id_unique" UNIQUE("name","user_id")
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"quote" text,
	"status" "Status" DEFAULT 'UNEXPORTED' NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "Status" DEFAULT 'UNEXPORTED' NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"content_type" text NOT NULL,
	"file_size" integer,
	"width" integer,
	"height" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"quote" text,
	"status" "Status" DEFAULT 'UNEXPORTED' NOT NULL,
	"category_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "st_books" (
	"isbn" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"google_title" text NOT NULL,
	"google_subtitle" text NOT NULL,
	"google_authors" text[] NOT NULL,
	"google_description" text NOT NULL,
	"google_img_src" text NOT NULL,
	"google_href" text NOT NULL,
	"markdown" text NOT NULL,
	"uint8ArrayImage" "bytea" NOT NULL,
	"rating" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "st_books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "st_contents" (
	"title" text PRIMARY KEY NOT NULL,
	"markdown" text NOT NULL,
	"uint8ArrayImage" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "st_contents_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "st_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"content_type" text NOT NULL,
	"file_size" integer,
	"width" integer,
	"height" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "st_news" (
	"id" serial DEFAULT 0 NOT NULL,
	"url" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"quote" text,
	"og_image_url" text,
	"og_title" text,
	"og_description" text,
	"category_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "st_news_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "st_news" ADD CONSTRAINT "st_news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE cascade;