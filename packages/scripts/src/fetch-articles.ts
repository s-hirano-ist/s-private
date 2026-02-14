#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";

type Article = {
	id: string;
	title: string;
	url: string;
	quote: string | null;
	categoryName: string;
};

type Template = {
	heading: string;
	description: string;
	body: BodyItem[];
};

type BodyItem = {
	title: string;
	quote: string;
	url: string;
};

type OutputType = Record<
	string,
	{
		title: string;
		quote: string;
		url: string;
	}[]
>;

const OUTPUT_PATH = "json/article";

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	function categorizeArticles(articles: Article[]): OutputType {
		return articles.reduce((acc, d) => {
			if (!acc[d.categoryName]) acc[d.categoryName] = [];
			const { title, quote, url } = d;
			acc[d.categoryName].push({ title, quote: quote ?? "", url });
			return acc;
		}, {} as OutputType);
	}

	async function readFileOrCreate(key: string): Promise<Template> {
		const filePath = `${OUTPUT_PATH}/${key}.json`;

		try {
			const data = await readFile(filePath, "utf8");
			return JSON.parse(data) as Template;
		} catch {
			// File does not exist, create it
			await mkdir(dirname(filePath), { recursive: true });
			const data: Template = { heading: key, description: "FIXME", body: [] };
			const jsonData = JSON.stringify(data, null, 2);
			await writeFile(filePath, jsonData);
			return data;
		}
	}

	async function exportData(data: OutputType) {
		for (const [key, value] of Object.entries(data)) {
			console.log(`Key: ${key}`);
			const originalData = await readFileOrCreate(key);

			originalData.body.push(...value);
			await writeFile(
				`${OUTPUT_PATH}/${key}.json`,
				`${JSON.stringify(originalData, null, 2)}\n`,
			);
		}
	}

	async function fetchArticles() {
		const rawArticles = await prisma.article.findMany({
			where: { userId, status: UNEXPORTED },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
				Category: true,
			},
		});
		const articles: Article[] = rawArticles.map(
			(d: (typeof rawArticles)[number]) => ({
				id: d.id,
				title: d.title,
				url: d.url,
				quote: d.quote,
				categoryName: d.Category?.name ?? "",
			}),
		);
		console.log(`📊 ${articles.length} 件のデータを取得しました。`);

		await exportData(categorizeArticles(articles));
		console.log("💾 データがJSONファイルに書き出されました。");
	}

	try {
		await fetchArticles();
		await notificationService.notifyInfo("fetch-articles completed", {
			caller: "fetch-articles",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`fetch-articles failed: ${error}`, {
			caller: "fetch-articles",
		});
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
