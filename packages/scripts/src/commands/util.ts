import { defineCommand } from "citty";
import consola from "consola";
import {
	getBaseEnv,
	getNotificationService,
} from "../handlers/shared/index.js";
import { findDuplicateJsonArticles } from "../handlers/util/find-duplicates.js";

const findDuplicatesCommand = defineCommand({
	meta: {
		name: "find-duplicates",
		description: "Find duplicate URLs in JSON articles",
	},
	run: async () => {
		const env = getBaseEnv();
		const notification = getNotificationService(env);

		try {
			consola.start("Finding duplicate articles...");
			await findDuplicateJsonArticles();
			consola.success("Search completed");
			await notification.notifyInfo("find-duplicate-json-articles completed", {
				caller: "find-duplicate-json-articles",
			});
		} catch (error) {
			consola.error("Error finding duplicates:", error);
			await notification.notifyError(
				`find-duplicate-json-articles failed: ${error}`,
				{
					caller: "find-duplicate-json-articles",
				},
			);
			process.exit(1);
		}
	},
});

export const utilCommand = defineCommand({
	meta: {
		name: "util",
		description: "Utility commands",
	},
	subCommands: {
		"find-duplicates": findDuplicatesCommand,
	},
});
