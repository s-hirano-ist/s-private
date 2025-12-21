import { defineCommand } from "citty";
import consola from "consola";
import { revertArticles } from "../handlers/revert/articles.js";
import { revertBooks } from "../handlers/revert/books.js";
import { revertImages } from "../handlers/revert/images.js";
import { revertNotes } from "../handlers/revert/notes.js";
import {
	getBaseEnv,
	getNotificationService,
	getPrisma,
} from "../handlers/shared/index.js";

const articlesCommand = defineCommand({
	meta: {
		name: "articles",
		description: "Revert article status (LAST_UPDATED -> UNEXPORTED)",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Reverting articles...");
			await revertArticles(prisma, env);
			consola.success("Articles reverted successfully");
			await notification.notifyInfo("revert-articles completed", {
				caller: "revert-articles",
			});
		} catch (error) {
			consola.error("Error reverting articles:", error);
			await notification.notifyError(`revert-articles failed: ${error}`, {
				caller: "revert-articles",
			});
			process.exit(1);
		}
	},
});

const booksCommand = defineCommand({
	meta: {
		name: "books",
		description: "Revert book status (LAST_UPDATED -> UNEXPORTED)",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Reverting books...");
			await revertBooks(prisma, env);
			consola.success("Books reverted successfully");
			await notification.notifyInfo("revert-books completed", {
				caller: "revert-books",
			});
		} catch (error) {
			consola.error("Error reverting books:", error);
			await notification.notifyError(`revert-books failed: ${error}`, {
				caller: "revert-books",
			});
			process.exit(1);
		}
	},
});

const imagesCommand = defineCommand({
	meta: {
		name: "images",
		description: "Revert image status (LAST_UPDATED -> UNEXPORTED)",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Reverting images...");
			await revertImages(prisma, env);
			consola.success("Images reverted successfully");
			await notification.notifyInfo("revert-images completed", {
				caller: "revert-images",
			});
		} catch (error) {
			consola.error("Error reverting images:", error);
			await notification.notifyError(`revert-images failed: ${error}`, {
				caller: "revert-images",
			});
			process.exit(1);
		}
	},
});

const notesCommand = defineCommand({
	meta: {
		name: "notes",
		description: "Revert note status (LAST_UPDATED -> UNEXPORTED)",
	},
	run: async () => {
		const env = getBaseEnv();
		const prisma = getPrisma(env.DATABASE_URL);
		const notification = getNotificationService(env);

		try {
			consola.start("Reverting notes...");
			await revertNotes(prisma, env);
			consola.success("Notes reverted successfully");
			await notification.notifyInfo("revert-notes completed", {
				caller: "revert-notes",
			});
		} catch (error) {
			consola.error("Error reverting notes:", error);
			await notification.notifyError(`revert-notes failed: ${error}`, {
				caller: "revert-notes",
			});
			process.exit(1);
		}
	},
});

export const revertCommand = defineCommand({
	meta: {
		name: "revert",
		description: "Revert status (LAST_UPDATED -> UNEXPORTED)",
	},
	subCommands: {
		articles: articlesCommand,
		books: booksCommand,
		images: imagesCommand,
		notes: notesCommand,
	},
});
