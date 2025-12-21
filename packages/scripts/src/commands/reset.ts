import { defineCommand } from "citty";
import consola from "consola";
import { resetArticles } from "../handlers/reset/articles.js";
import { resetBooks } from "../handlers/reset/books.js";
import { resetImages } from "../handlers/reset/images.js";
import { resetNotes } from "../handlers/reset/notes.js";
import {
	getBaseEnv,
	getNotificationService,
	getPrisma,
} from "../handlers/shared/index.js";

const articlesCommand = defineCommand({
	meta: {
		name: "articles",
		description: "Reset article export status",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Resetting articles...");
			await resetArticles(prisma, env);
			consola.success("Articles reset successfully");
			await notification.notifyInfo("reset-articles completed", {
				caller: "reset-articles",
			});
		} catch (error) {
			consola.error("Error resetting articles:", error);
			await notification.notifyError(`reset-articles failed: ${error}`, {
				caller: "reset-articles",
			});
			process.exit(1);
		}
	},
});

const booksCommand = defineCommand({
	meta: {
		name: "books",
		description: "Reset book export status",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Resetting books...");
			await resetBooks(prisma, env);
			consola.success("Books reset successfully");
			await notification.notifyInfo("reset-books completed", {
				caller: "reset-books",
			});
		} catch (error) {
			consola.error("Error resetting books:", error);
			await notification.notifyError(`reset-books failed: ${error}`, {
				caller: "reset-books",
			});
			process.exit(1);
		}
	},
});

const imagesCommand = defineCommand({
	meta: {
		name: "images",
		description: "Reset image export status",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Resetting images...");
			await resetImages(prisma, env);
			consola.success("Images reset successfully");
			await notification.notifyInfo("reset-images completed", {
				caller: "reset-images",
			});
		} catch (error) {
			consola.error("Error resetting images:", error);
			await notification.notifyError(`reset-images failed: ${error}`, {
				caller: "reset-images",
			});
			process.exit(1);
		}
	},
});

const notesCommand = defineCommand({
	meta: {
		name: "notes",
		description: "Reset note export status",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Resetting notes...");
			await resetNotes(prisma, env);
			consola.success("Notes reset successfully");
			await notification.notifyInfo("reset-notes completed", {
				caller: "reset-notes",
			});
		} catch (error) {
			consola.error("Error resetting notes:", error);
			await notification.notifyError(`reset-notes failed: ${error}`, {
				caller: "reset-notes",
			});
			process.exit(1);
		}
	},
});

export const resetCommand = defineCommand({
	meta: {
		name: "reset",
		description: "Reset export status (UNEXPORTED -> LAST_UPDATED -> EXPORTED)",
	},
	subCommands: {
		articles: articlesCommand,
		books: booksCommand,
		images: imagesCommand,
		notes: notesCommand,
	},
});
