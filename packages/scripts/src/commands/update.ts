import { defineCommand } from "citty";
import consola from "consola";
import { getBaseEnv, getNotificationService } from "../handlers/shared/index.js";
import { updateJsonArticles } from "../handlers/update/json-articles.js";
import { updateRawArticles } from "../handlers/update/raw-articles.js";

const jsonCommand = defineCommand({
	meta: {
		name: "json",
		description: "Fetch OG tags for JSON articles",
	},
	run: async () => {
		const env = getBaseEnv();
		const notification = getNotificationService(env);

		try {
			consola.start("Updating JSON articles with OG tags...");
			await updateJsonArticles();
			consola.success("JSON articles updated successfully");
			await notification.notifyInfo("update-json-articles completed", {
				caller: "update-json-articles",
			});
		} catch (error) {
			consola.error("Error updating JSON articles:", error);
			await notification.notifyError(`update-json-articles failed: ${error}`, {
				caller: "update-json-articles",
			});
			process.exit(1);
		}
	},
});

const rawCommand = defineCommand({
	meta: {
		name: "raw",
		description: "Fetch full page content as markdown",
	},
	run: async () => {
		const env = getBaseEnv();
		const notification = getNotificationService(env);

		try {
			consola.start("Updating raw articles...");
			await updateRawArticles();
			consola.success("Raw articles updated successfully");
			await notification.notifyInfo("update-raw-articles completed", {
				caller: "update-raw-articles",
			});
		} catch (error) {
			consola.error("Error updating raw articles:", error);
			await notification.notifyError(`update-raw-articles failed: ${error}`, {
				caller: "update-raw-articles",
			});
			process.exit(1);
		}
	},
});

export const updateCommand = defineCommand({
	meta: {
		name: "update",
		description: "Update article data",
	},
	subCommands: {
		json: jsonCommand,
		raw: rawCommand,
	},
});
