import type { RssImport } from "@s-hirano-ist/s-application/rss/ports";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import {
	array,
	record,
	text,
	httpUrl,
	isoDate,
	parseXml,
	imageMetadata,
} from "@s-hirano-ist/s-infrastructure/rss/parser";
export function parseRssImport(
	kind: "opml" | "starred",
	content: string,
): RssImport {
	const result: RssImport = { feeds: [], saved: [], invalid: 0 };
	try {
		if (kind === "opml") {
			const root = record(parseXml(content));
			if (!root.opml) throw new Error("Expected OPML");
			const walk = (outlines: unknown, folder: string, depth: number) => {
				if (depth > 20) throw new Error("OPML too deep");
				for (const value of array(outlines)) {
					const item = record(value);
					if (item["@xmlUrl"]) {
						try {
							const url = httpUrl(text(item["@xmlUrl"]));
							result.feeds.push({
								url,
								title: (text(item["@title"] ?? item["@text"]) || url).slice(
									0,
									512,
								),
								folder: folder.slice(0, 512),
							});
						} catch {
							result.invalid++;
						}
					} else if (item.outline)
						walk(
							item.outline,
							[folder, text(item["@title"] ?? item["@text"])]
								.filter(Boolean)
								.join(" / "),
							depth + 1,
						);
				}
			};
			walk(record(record(root.opml).body).outline, "", 0);
		} else {
			const root: unknown = JSON.parse(content);
			const items = Array.isArray(root) ? root : record(root).items;
			if (!Array.isArray(items))
				throw new TypeError("Expected Inoreader items array");
			for (const value of items) {
				const item = record(value);
				try {
					const links = [...array(item.canonical), ...array(item.alternate)];
					const href =
						links.map((link) => text(record(link).href)).find(Boolean) ||
						text(item.url);
					const url = httpUrl(href);
					result.saved.push({
						url,
						title: (text(item.title) || url).slice(0, 512),
						publishedAt: isoDate(item.published),
						...imageMetadata(item, url),
					});
				} catch {
					result.invalid++;
				}
			}
		}
		if (result.feeds.length > 1000 || result.saved.length > 10000)
			throw new Error("Import too large");
		return result;
	} catch {
		throw new ApplicationError("VALIDATION_ERROR");
	}
}
