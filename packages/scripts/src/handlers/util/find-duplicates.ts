import fs from "node:fs";
import { join } from "node:path";

interface ArticleItem {
	title: string;
	url: string;
	quote?: string;
	ogImageUrl?: string;
	ogTitle?: string;
	ogDescription?: string;
}

interface ArticleFile {
	heading: string;
	description: string;
	body: ArticleItem[];
}

interface UrlOccurrence {
	url: string;
	title: string;
	fileName: string;
	category: string;
}

interface DuplicateUrl {
	url: string;
	occurrences: UrlOccurrence[];
}

function getAllJsonFiles(directory: string): string[] {
	return fs
		.readdirSync(directory)
		.filter((file) => file.endsWith(".json") && file !== ".DS_Store");
}

function readArticleFile(filePath: string): ArticleFile {
	const fileContents = fs.readFileSync(filePath, "utf8");
	return JSON.parse(fileContents) as ArticleFile;
}

function findDuplicateUrls(): DuplicateUrl[] {
	const articleDirectory = join(process.cwd(), "json", "article");
	const jsonFiles = getAllJsonFiles(articleDirectory);

	console.log(`Number of JSON files to search: ${jsonFiles.length}`);
	console.log(`Files: ${jsonFiles.join(", ")}\n`);

	const urlMap = new Map<string, UrlOccurrence[]>();
	let totalUrls = 0;

	for (const fileName of jsonFiles) {
		const filePath = join(articleDirectory, fileName);

		try {
			const articleFile = readArticleFile(filePath);
			const category = articleFile.heading;

			console.log(
				`Processing: ${fileName} (category: ${category}, articles: ${articleFile.body.length})`,
			);

			for (const item of articleFile.body) {
				totalUrls++;

				const occurrence: UrlOccurrence = {
					url: item.url,
					title: item.title,
					fileName,
					category,
				};

				if (urlMap.has(item.url)) {
					urlMap.get(item.url)!.push(occurrence);
				} else {
					urlMap.set(item.url, [occurrence]);
				}
			}
		} catch (error) {
			console.error(`Error: Failed to read ${fileName}:`, error);
		}
	}

	console.log(`\nTotal URLs: ${totalUrls}`);
	console.log(`Unique URLs: ${urlMap.size}`);

	const duplicates: DuplicateUrl[] = [];

	for (const [url, occurrences] of urlMap.entries()) {
		if (occurrences.length > 1) {
			duplicates.push({
				url,
				occurrences,
			});
		}
	}

	return duplicates;
}

function displayResults(duplicates: DuplicateUrl[]): void {
	console.log("\n=== Duplicate URL Detection Results ===");
	console.log(`Duplicate URLs found: ${duplicates.length}\n`);

	if (duplicates.length === 0) {
		console.log("No duplicate URLs found!");
		return;
	}

	duplicates.sort((a, b) => b.occurrences.length - a.occurrences.length);

	duplicates.forEach((duplicate, index) => {
		console.log(`${index + 1}. URL: ${duplicate.url}`);
		console.log(`   Duplicates: ${duplicate.occurrences.length} times`);

		duplicate.occurrences.forEach((occurrence, occIndex) => {
			console.log(
				`   ${occIndex + 1}) [${occurrence.category}] ${occurrence.fileName}`,
			);
			console.log(`      Title: ${occurrence.title}`);
		});

		console.log("");
	});

	const totalDuplicateOccurrences = duplicates.reduce(
		(sum, dup) => sum + dup.occurrences.length,
		0,
	);
	const wastedEntries = totalDuplicateOccurrences - duplicates.length;

	console.log("=== Summary ===");
	console.log(`Wasted entries due to duplicates: ${wastedEntries}`);
	console.log(
		`Most duplicated URL: ${duplicates[0]?.occurrences.length || 0} times`,
	);

	const categoryStats = new Map<string, number>();
	duplicates.forEach((dup) => {
		dup.occurrences.forEach((occ) => {
			categoryStats.set(
				occ.category,
				(categoryStats.get(occ.category) || 0) + 1,
			);
		});
	});

	console.log("\nDuplicates by category:");
	Array.from(categoryStats.entries())
		.sort((a, b) => b[1] - a[1])
		.forEach(([category, count]) => {
			console.log(`  ${category}: ${count} duplicate entries`);
		});
}

export async function findDuplicateJsonArticles(): Promise<void> {
	console.log("Searching for duplicate URLs in json/article directory...\n");

	const duplicates = findDuplicateUrls();
	displayResults(duplicates);

	console.log("\nSearch completed");
}
