import { defineCommand } from "citty";
import { fetchCommand } from "./commands/fetch.js";
import { ragCommand } from "./commands/rag.js";
import { resetCommand } from "./commands/reset.js";
import { revertCommand } from "./commands/revert.js";
import { updateCommand } from "./commands/update.js";
import { utilCommand } from "./commands/util.js";

export const main = defineCommand({
	meta: {
		name: "s-scripts",
		version: "0.1.2",
		description: "CLI scripts for content export and transformation",
	},
	subCommands: {
		fetch: fetchCommand,
		reset: resetCommand,
		revert: revertCommand,
		update: updateCommand,
		rag: ragCommand,
		util: utilCommand,
	},
});
