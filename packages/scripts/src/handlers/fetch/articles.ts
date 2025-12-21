import { readFile, writeFile } from "node:fs/promises";
import { makeUnexportedStatus, makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database";
import type { BaseEnv } from "../shared/env.js";

type ArticleWithCategory = {
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

const OUTPUT_PATH = "json/article";

type OutputType = Record<
	string,
	{
		title: string;
		quote: string;
		url: string;
	}[]
>;

function categorizeArticles(articles: ArticleWithCategory[]): OutputType {
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
	} catch (_error) {
		const data: Template = { heading: key, description: "FIXME", body: [] };
		const jsonData = JSON.stringify(data, null, 2);
		await writeFile(filePath, jsonData);
		return data;
	}
}

async function exportData(data: OutputType): Promise<void> {
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

export async function fetchArticles(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();

	const articles = (
		await prisma.article.findMany({
			where: { userId, status: UNEXPORTED },
			select: { id: true, title: true, quote: true, url: true, Category: true },
		})
	).map((d: { id: string; title: string; quote: string | null; url: string; Category: { name: string } }) => {
		return { ...d, categoryName: d.Category.name };
	});
	console.log("Data fetched.");

	await exportData(categorizeArticles(articles));
	console.log("Data exported to JSON files.");
}
