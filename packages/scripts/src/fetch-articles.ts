#!/usr/bin/env node
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runCli, cliNotifications } from "./lib/cli-observability.js";

type Article = {
	categoryName: string;
	id: string;
	quote: string | null;
	title: string;
	url: string;
};

type Template = {
	body: BodyItem[];
	description: string;
	heading: string;
};

type BodyItem = {
	quote: string;
	title: string;
	url: string;
};

type OutputType = Record<
	string,
	{
		quote: string;
		title: string;
		url: string;
	}[]
>;

const OUTPUT_PATH = "json/article";

function categorizeArticles(articles: Article[]): OutputType {
	return articles.reduce<OutputType>((acc, d) => {
		const { title, quote, url, categoryName } = d;
		// oxlint-disable-next-line typescript/no-unnecessary-condition -- Record index access is undefined at runtime for new keys; initializes the bucket
		if (!acc[categoryName]) acc[categoryName] = [];
		acc[categoryName].push({ title, quote: quote ?? "", url });
		return acc;
	}, {});
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

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = cliNotifications;

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

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
				// oxlint-disable-next-line typescript/no-unnecessary-condition -- Prisma row is an external runtime boundary; relation/name may differ from declared non-null type
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
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("fetch-articles", main);
