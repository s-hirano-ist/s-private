import { defineCommand } from "citty";
import consola from "consola";
import { fetchArticles } from "../handlers/fetch/articles.js";
import { fetchBooks } from "../handlers/fetch/books.js";
import { fetchImages } from "../handlers/fetch/images.js";
import { fetchNotes } from "../handlers/fetch/notes.js";
import {
	getBaseEnv,
	getMinioEnv,
	getNotificationService,
	getPrisma,
} from "../handlers/shared/index.js";

const articlesCommand = defineCommand({
	meta: {
		name: "articles",
		description: "Fetch and export articles from database",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Fetching articles...");
			await fetchArticles(prisma, env);
			consola.success("Articles fetched successfully");
			await notification.notifyInfo("fetch-articles completed", {
				caller: "fetch-articles",
			});
		} catch (error) {
			consola.error("Error fetching articles:", error);
			await notification.notifyError(`fetch-articles failed: ${error}`, {
				caller: "fetch-articles",
			});
			process.exit(1);
		}
	},
});

const booksCommand = defineCommand({
	meta: {
		name: "books",
		description: "Fetch and export books from database",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Fetching books...");
			await fetchBooks(prisma, env);
			consola.success("Books fetched successfully");
			await notification.notifyInfo("fetch-books completed", {
				caller: "fetch-books",
			});
		} catch (error) {
			consola.error("Error fetching books:", error);
			await notification.notifyError(`fetch-books failed: ${error}`, {
				caller: "fetch-books",
			});
			process.exit(1);
		}
	},
});

const imagesCommand = defineCommand({
	meta: {
		name: "images",
		description: "Fetch and export images from MinIO",
	},
	run: async () => {
		const env = getMinioEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Fetching images...");
			await fetchImages(prisma, env);
			consola.success("Images fetched successfully");
			await notification.notifyInfo("fetch-images completed", {
				caller: "fetch-images",
			});
		} catch (error) {
			consola.error("Error fetching images:", error);
			await notification.notifyError(`fetch-images failed: ${error}`, {
				caller: "fetch-images",
			});
			process.exit(1);
		}
	},
});

const notesCommand = defineCommand({
	meta: {
		name: "notes",
		description: "Fetch and export notes from database",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Fetching notes...");
			await fetchNotes(prisma, env);
			consola.success("Notes fetched successfully");
			await notification.notifyInfo("fetch-notes completed", {
				caller: "fetch-notes",
			});
		} catch (error) {
			consola.error("Error fetching notes:", error);
			await notification.notifyError(`fetch-notes failed: ${error}`, {
				caller: "fetch-notes",
			});
			process.exit(1);
		}
	},
});

export const fetchCommand = defineCommand({
	meta: {
		name: "fetch",
		description: "Fetch and export data from database",
	},
	subCommands: {
		articles: articlesCommand,
		books: booksCommand,
		images: imagesCommand,
		notes: notesCommand,
	},
});
