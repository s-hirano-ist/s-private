import { isPublicAddress } from "@s-hirano-ist/s-infrastructure/rss/fetch-feed";
import { parseRssImport } from "@s-hirano-ist/s-infrastructure/rss/import";
import { parseFeed } from "@s-hirano-ist/s-infrastructure/rss/parser";
import { describe, expect, test } from "vitest";
describe("RSS ingestion", () => {
	test("keeps RSS identity separate from dates and strips bodies", () => {
		const result = parseFeed(
			`<rss version="2.0"><channel><title>News &amp; updates</title><item><guid isPermaLink="false">stable-id</guid><title>First</title><link>/one#fragment</link><description>large body</description><pubDate>invalid</pubDate></item><item><title>Bad</title><link>javascript:alert(1)</link></item></channel></rss>`,
			"https://example.com/feed",
		);
		expect(result).toEqual({
			title: "News & updates",
			entries: [
				{
					identity: "stable-id",
					url: "https://example.com/one",
					title: "First",
					publishedAt: null,
				},
			],
		});
	});
	test("permits literal HTML declarations inside discarded CDATA article bodies", () => {
		const result = parseFeed(
			`<rss><channel><title>News</title><item><link>https://example.com/one</link><description><![CDATA[<!DOCTYPE html><html><body>Article</body></html>]]></description></item></channel></rss>`,
			"https://example.com/feed",
		);
		expect(result.entries).toEqual([
			{
				identity: "https://example.com/one",
				url: "https://example.com/one",
				title: "https://example.com/one",
				publishedAt: null,
			},
		]);
	});

	test("reads Atom alternate links and URL fallback identity", () => {
		const result = parseFeed(
			`<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><id>tag:one</id><title>A</title><link rel="self" href="/api/one"/><link rel="alternate" href="/one"/><updated>2026-11-15T00:00:00Z</updated></entry><entry><link href="https://example.com/two"/></entry></feed>`,
			"https://example.com/feed",
		);
		expect(result.entries[0]).toMatchObject({
			identity: "tag:one",
			url: "https://example.com/one",
			publishedAt: "2026-11-15T00:00:00.000Z",
		});
		expect(result.entries[1].identity).toBe("https://example.com/two");
	});
	test.each([
		`<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>`,
		`<rss><channel></rss>`,
		`<html/>`,
	])("rejects unsafe or non-feed XML", (xml) => {
		expect(() => parseFeed(xml, "https://example.com")).toThrow(
			/Invalid XML|Expected RSS/u,
		);
	});
	test("imports nested OPML folders and rejects unsafe URLs", () => {
		expect(
			parseRssImport(
				"opml",
				`<opml><body><outline text="Tech"><outline title="News" xmlUrl="https://example.com/feed"/><outline xmlUrl="file:///tmp/a"/></outline></body></opml>`,
			),
		).toEqual({
			feeds: [
				{ title: "News", url: "https://example.com/feed", folder: "Tech" },
			],
			saved: [],
			invalid: 1,
		});
	});
	test("imports Google Reader-compatible Inoreader starred JSON without requiring a feed", () => {
		const result = parseRssImport(
			"starred",
			JSON.stringify({
				items: [
					{
						title: "Saved",
						canonical: [{ href: "https://example.com/one" }],
						published: 1700000000,
						summary: { content: "discard me" },
					},
					{
						title: "Fallback",
						alternate: [{ href: "https://example.com/two" }],
					},
					{ title: "invalid" },
				],
			}),
		);
		expect(result.saved).toHaveLength(2);
		expect(result.saved[0]).toEqual({
			title: "Saved",
			url: "https://example.com/one",
			publishedAt: "2023-11-14T22:13:20.000Z",
		});
		expect(result.invalid).toBe(1);
	});
	test.each(["{}", "not json"])("rejects unknown exports", (content) => {
		expect(() => parseRssImport("starred", content)).toThrow(
			"VALIDATION_ERROR",
		);
	});
	test.each([
		"127.0.0.1",
		"10.0.0.1",
		"172.16.0.1",
		"192.168.1.1",
		"169.254.169.254",
		"100.64.0.1",
		"0.0.0.0",
		"224.0.0.1",
		"::1",
		"fe80::1",
		"fc00::1",
		"::ffff:127.0.0.1",
	])("blocks non-public destination %s", (address) => {
		expect(isPublicAddress(address)).toBe(false);
	});
	test.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
		"accepts public destination %s",
		(address) => {
			expect(isPublicAddress(address)).toBe(true);
		},
	);
});
