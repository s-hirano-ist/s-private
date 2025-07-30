import {
	pgTable,
	text,
	integer,
	timestamp,
	pgEnum,
	uuid,
	unique,
	serial,
	customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const bytea = customType<{ data: Buffer; default: false; notNull: true; }>({
	dataType() {
		return "bytea";
	},
	toDriver(value: Buffer): Buffer {
		return value;
	},
	fromDriver(value: unknown): Buffer {
		if (value instanceof Buffer) {
			return value;
		}
		if (typeof value === "string") {
			return Buffer.from(value, "hex");
		}
		throw new Error("Invalid bytea value");
	},
});

export const statusEnum = pgEnum("Status", [
	"UNEXPORTED",
	"UPDATED_RECENTLY",
	"EXPORTED",
]);

export const categories = pgTable(
	"categories",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		userId: text("user_id").notNull(),
	},
	(table) => ({
		nameUserIdUnique: unique().on(table.name, table.userId),
	}),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
	news: many(news),
	staticNews: many(staticNews),
}));

export const news = pgTable("news", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	url: text("url").notNull(),
	quote: text("quote"),
	status: statusEnum("status").default("UNEXPORTED").notNull(),
	categoryId: integer("category_id")
		.notNull()
		.references(() => categories.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const newsRelations = relations(news, ({ one }) => ({
	category: one(categories, {
		fields: [news.categoryId],
		references: [categories.id],
	}),
}));

export const contents = pgTable("contents", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	url: text("url").notNull(),
	quote: text("quote"),
	status: statusEnum("status").default("UNEXPORTED").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const images = pgTable("images", {
	id: uuid("id").primaryKey().defaultRandom(),
	status: statusEnum("status").default("UNEXPORTED").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
	contentType: text("content_type").notNull(),
	fileSize: integer("file_size"),
	width: integer("width"),
	height: integer("height"),
	tags: text("tags").array().default([]).notNull(),
	description: text("description"),
});

export const staticNews = pgTable("st_news", {
	id: serial("id").notNull().default(0),
	url: text("url").primaryKey().unique(),
	title: text("title").notNull(),
	quote: text("quote"),
	ogImageUrl: text("og_image_url"),
	ogTitle: text("og_title"),
	ogDescription: text("og_description"),
	categoryId: integer("category_id")
		.notNull()
		.references(() => categories.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staticNewsRelations = relations(staticNews, ({ one }) => ({
	category: one(categories, {
		fields: [staticNews.categoryId],
		references: [categories.id],
	}),
}));

export const staticContents = pgTable("st_contents", {
	title: text("title").primaryKey().unique(),
	markdown: text("markdown").notNull(),
	uint8ArrayImage: bytea("uint8ArrayImage").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staticBooks = pgTable("st_books", {
	ISBN: text("isbn").primaryKey().unique(),
	title: text("title").notNull(),
	googleTitle: text("google_title").notNull(),
	googleSubTitle: text("google_subtitle").notNull(),
	googleAuthors: text("google_authors").array().notNull(),
	googleDescription: text("google_description").notNull(),
	googleImgSrc: text("google_img_src").notNull(),
	googleHref: text("google_href").notNull(),
	markdown: text("markdown").notNull(),
	uint8ArrayImage: bytea("uint8ArrayImage").notNull(),
	rating: integer("rating"),
	tags: text("tags").array().default([]).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staticImages = pgTable("st_images", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	contentType: text("content_type").notNull(),
	fileSize: integer("file_size"),
	width: integer("width"),
	height: integer("height"),
	tags: text("tags").array().default([]).notNull(),
	description: text("description"),
});

export type Status = (typeof statusEnum.enumValues)[number];
export type Categories = typeof categories.$inferSelect;
export type NewCategories = typeof categories.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type Contents = typeof contents.$inferSelect;
export type NewContents = typeof contents.$inferInsert;
export type Images = typeof images.$inferSelect;
export type NewImages = typeof images.$inferInsert;
export type StaticNews = typeof staticNews.$inferSelect;
export type NewStaticNews = typeof staticNews.$inferInsert;
export type StaticContents = typeof staticContents.$inferSelect;
export type NewStaticContents = typeof staticContents.$inferInsert;
export type StaticBooks = typeof staticBooks.$inferSelect;
export type NewStaticBooks = typeof staticBooks.$inferInsert;
export type StaticImages = typeof staticImages.$inferSelect;
export type NewStaticImages = typeof staticImages.$inferInsert;