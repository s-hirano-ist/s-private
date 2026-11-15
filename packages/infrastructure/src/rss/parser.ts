import type { ParsedEntry } from "@s-hirano-ist/s-core/rss/types";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
export function parseXml(xml: string): unknown {
	try {
		// Inspect tokens without deleting text: removing comments can join adjacent
		// fragments into a declaration that was not present in the original XML.
		for (const token of xml.matchAll(
			/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<!DOCTYPE|<!ENTITY/giu,
		)) {
			if (/^<!DOCTYPE|^<!ENTITY/iu.test(token[0]))
				throw new Error("Unsafe declaration");
		}
		SyntaxValidator.validate(xml);
	} catch {
		throw new Error("Invalid XML");
	}
	return new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@",
		parseTagValue: false,
		processEntities: true,
	}).parse(xml) as unknown;
}
export function record(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}
export function array(value: unknown): unknown[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}
export function text(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	const content = record(value)["#text"];
	return typeof content === "string" ? content : "";
}
export function httpUrl(value: string, base?: string): string {
	const url = new URL(value, base);
	if (
		!["https:", "http:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.href.length > 2048
	)
		throw new Error("Invalid URL");
	url.hash = "";
	return url.href;
}
export function isoDate(value: unknown): string | null {
	const date = new Date(typeof value === "number" ? value * 1000 : text(value));
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
export function parseFeed(
	xml: string,
	base: string,
): { entries: ParsedEntry[]; title: string } {
	const root = record(parseXml(xml));
	const channel = record(record(root.rss).channel);
	const atom = record(root.feed);
	if (!root.rss && !root.feed) throw new Error("Expected RSS 2.0 or Atom");
	const entries: ParsedEntry[] = [];
	for (const value of array(root.feed ? atom.entry : channel.item)) {
		const item = record(value);
		const link = root.feed
			? array(item.link)
					.map((linkValue) => record(linkValue))
					.find(
						(candidate) =>
							!candidate["@rel"] || candidate["@rel"] === "alternate",
					)?.["@href"]
			: item.link;
		// Skip items without a usable web URL; never create a link to javascript:.
		try {
			const url = httpUrl(text(link), base);
			const identity = text(item.id ?? item.guid) || url;
			if (identity.length > 8192) continue;
			entries.push({
				identity,
				url,
				title: (text(item.title) || url).slice(0, 512),
				publishedAt: isoDate(item.published ?? item.pubDate ?? item.updated),
			});
		} catch {
			/* Non-web items are not actionable in this reader. */
		}
	}
	if (entries.length > 10000) throw new Error("Too many entries");
	return { title: text(atom.title ?? channel.title).slice(0, 512), entries };
}
