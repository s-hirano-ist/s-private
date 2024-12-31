import "server-only";
import fs from "node:fs";
import { join } from "node:path";
import { loggerError } from "@/pino";

export function getAllSlugs(path: string) {
	const contentsDirectory = join(process.cwd(), "s-contents/markdown", path);
	try {
		return fs
			.readdirSync(contentsDirectory)
			.filter((slug) => slug !== ".DS_Store");
	} catch (error) {
		loggerError(
			`Error reading directory ${contentsDirectory}:`,
			{
				caller: "getAllSlugs",
				status: 500,
			},
			error,
		);
		return [];
	}
}

export function getAllImages(path: string) {
	const imagesDirectory = join(process.cwd(), "s-contents/image", path);
	try {
		return fs
			.readdirSync(imagesDirectory)
			.filter((slug) => slug !== ".DS_Store");
	} catch (error) {
		loggerError(
			`Error reading directory ${imagesDirectory}:`,
			{
				caller: "getAllImages",
				status: 500,
			},
			error,
		);
		return [];
	}
}
