import { isPublicAddress } from "@s-hirano-ist/s-infrastructure/rss/fetch-feed";
import { parseRssImport } from "@s-hirano-ist/s-infrastructure/rss/import";
import { parseFeed } from "@s-hirano-ist/s-infrastructure/rss/parser";
import { describe, expect, test } from "vitest";

const numericTitle =
	"[&#x6CD5;&#26519;&#x5CB3;&#20043;] 36&#x4E07;&#x5186;&#x1F600;";
test.each([
	[
		"RSS 2.0",
		`<rss><channel><title>&#x65E5;本語</title><item><title>${numericTitle}</title><link>https://example.com/article</link></item></channel></rss>`,
	],
	[
		"RSS 1.0",
		`<rdf:RDF xmlns="http://purl.org/rss/1.0/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><channel><title>&#x65E5;本語</title></channel><item><title>${numericTitle}</title><link>https://example.com/article</link></item></rdf:RDF>`,
	],
	[
		"Atom",
		`<feed><title>&#x65E5;本語</title><entry><title>${numericTitle}</title><link href="https://example.com/article"/></entry></feed>`,
	],
])(
	"expands hexadecimal, decimal and supplementary numeric references in %s titles",
	(_format, xml) => {
		const parsed = parseFeed(xml, "https://example.com/feed");
		expect(parsed.title).toBe("日本語");
		expect(parsed.entries[0].title).toBe("[法林岳之] 36万円😀");
	},
);

test("does not recursively decode escaped references or expand literal CDATA", () => {
	const parsed = parseFeed(
		"<rss><channel><title>News</title><item><title>&amp;#x6CD5;</title><link>/escaped</link></item><item><title><![CDATA[&#x6CD5;]]></title><link>/cdata</link></item></channel></rss>",
		"https://example.com/feed",
	);
	expect(parsed.entries.map((entry) => entry.title)).toEqual([
		"&#x6CD5;",
		"&#x6CD5;",
	]);
});

test("rejects non-web links after numeric references in text and attributes are expanded", () => {
	expect(
		parseFeed(
			"<rss><channel><item><link>&#x6a;avascript:alert(1)</link></item></channel></rss>",
			"https://example.com/feed",
		).entries,
	).toEqual([]);
	expect(
		parseFeed(
			'<feed><entry><link href="&#x6a;avascript:alert(1)"/></entry></feed>',
			"https://example.com/feed",
		).entries,
	).toEqual([]);
	const imported = parseRssImport(
		"opml",
		'<opml><body><outline title="&#x65E5;本語" xmlUrl="https://example.com/?a=1&amp;b=&#50;"/></body></opml>',
	);
	expect(imported.feeds[0]).toMatchObject({
		title: "日本語",
		url: "https://example.com/?a=1&b=2",
	});
});
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

test("comments and CDATA do not hide a following unsafe XML declaration", () => {
	for (const prefix of [
		"<!-- <!DOCTYPE ignored> -->",
		"<![CDATA[<!DOCTYPE ignored>]]>",
		"<!--one--><!--two-->",
	]) {
		expect(() =>
			parseFeed(`${prefix}<!DOCTYPE rss><rss/>`, "https://example.com"),
		).toThrow("Invalid XML");
	}
});

test("reads RSS 1.0 sibling items with RDF identity and Dublin Core dates", () => {
	const parsed = parseFeed(
		`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
 <channel rdf:about="https://example.com/feed"><title>Security &amp; News</title><items><rdf:Seq><rdf:li rdf:resource="stable-id"/></rdf:Seq></items></channel>
 <item rdf:about="stable-id"><title>Notice</title><link>/notice#fragment</link><dc:date>2026-11-16T12:00:00+09:00</dc:date><description>discard this body</description></item>
 <item><link>https://example.com/other</link><dc:date>invalid</dc:date></item>
 <item><link>javascript:alert(1)</link></item>
 </rdf:RDF>`,
		"https://example.com/feed",
	);
	expect(parsed).toEqual({
		title: "Security & News",
		entries: [
			{
				identity: "stable-id",
				title: "Notice",
				url: "https://example.com/notice",
				publishedAt: "2026-11-16T03:00:00.000Z",
			},
			{
				identity: "https://example.com/other",
				title: "https://example.com/other",
				url: "https://example.com/other",
				publishedAt: null,
			},
		],
	});
});
test("resolves namespace aliases, prefixed RSS elements and item-local declarations", () => {
	const xml = `<graph:RDF xmlns:graph="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:news="http://purl.org/rss/1.0/">
 <news:channel><news:title>News</news:title></news:channel>
 <news:item graph:about="stable-id" xmlns:dates="http://purl.org/dc/elements/1.1/" xmlns:headline="http://purl.org/rss/1.0/"><headline:title>Aliased</headline:title><news:link>/one</news:link><dates:date>2026-11-16T00:00:00Z</dates:date></news:item>
 </graph:RDF>`;
	expect(parseFeed(xml, "https://example.com/feed")).toEqual({
		title: "News",
		entries: [
			{
				identity: "stable-id",
				title: "Aliased",
				url: "https://example.com/one",
				publishedAt: "2026-11-16T00:00:00.000Z",
			},
		],
	});
});
test.each([
	'<rdf:RDF xmlns:rdf="https://wrong.example/rdf" xmlns="http://purl.org/rss/1.0/"><channel><title>Wrong</title></channel></rdf:RDF>',
	'<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="https://wrong.example/rss"><channel/></rdf:RDF>',
	'<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>',
])(
	"rejects RDF without an RSS channel or with mismatched namespaces",
	(xml) => {
		expect(() => parseFeed(xml, "https://example.com")).toThrow("Expected RSS");
	},
);
test("does not accept an unqualified about attribute as an RDF identity", () => {
	const xml = `<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><channel xmlns="http://purl.org/rss/1.0/"/><item xmlns="http://purl.org/rss/1.0/" about="wrong"><link>https://example.com/one</link></item></RDF>`;
	// A channel's local default namespace does not change the graph's sibling namespace.
	expect(parseFeed(xml, "https://example.com").entries).toEqual([
		{
			identity: "https://example.com/one",
			title: "https://example.com/one",
			url: "https://example.com/one",
			publishedAt: null,
		},
	]);
});

test("collects sibling items with locally declared and mixed RSS namespace prefixes", () => {
	const xml = `<r:RDF xmlns:r="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rss="http://purl.org/rss/1.0/">
 <rss:channel><rss:title>Mixed</rss:title></rss:channel>
 <item xmlns="http://purl.org/rss/1.0/"><link>https://example.com/one</link></item>
 <item xmlns="http://purl.org/rss/1.0/"><link>https://example.com/two</link></item>
 <rss:item><rss:link>https://example.com/three</rss:link></rss:item>
 </r:RDF>`;
	expect(
		parseFeed(xml, "https://example.com").entries.map((item) => item.url),
	).toEqual([
		"https://example.com/one",
		"https://example.com/two",
		"https://example.com/three",
	]);
});

describe("article thumbnails", () => {
	test.each([
		['<media:thumbnail url="/thumb.jpg"/>', "https://example.com/thumb.jpg"],
		[
			'<media:content medium="image" type="image/jpeg" url="https://cdn.example.com/photo.jpg"/>',
			"https://cdn.example.com/photo.jpg",
		],
		[
			'<media:group><media:thumbnail url="/group.jpg"/></media:group>',
			"https://example.com/group.jpg",
		],
		[
			'<enclosure type="image/png" url="/enclosure.png"/>',
			"https://example.com/enclosure.png",
		],
		[
			'<description><![CDATA[<p><img src="/photo.jpg?a=1&amp;b=2"></p>]]></description>',
			"https://example.com/photo.jpg?a=1&b=2",
		],
		[
			'<content:encoded><![CDATA[<img src="/content.jpg">]]></content:encoded>',
			"https://example.com/content.jpg",
		],
	])("extracts an HTTPS thumbnail from %s", (content, expected) => {
		const parsed = parseFeed(
			`<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item><link>https://example.com/article</link>${content}</item></channel></rss>`,
			"https://example.com/feed",
		);
		expect(parsed.entries[0]).toMatchObject({ imageUrl: expected });
		expect(parsed.entries[0]).not.toHaveProperty("description");
	});
	test("reads Atom image enclosures and keeps a valid article when images are unsafe", () => {
		const feed = parseFeed(
			'<feed><entry><link href="/one"/><link rel="enclosure" type="image/jpeg" href="/one.jpg"/></entry><entry><link href="/two"/><media:thumbnail url="javascript:alert(1)"/><content><![CDATA[<img src="data:image/png;base64,nope"><img src="http://example.com/insecure.jpg"><img src="https://user:password@example.com/private.jpg"><img src="https://example.com/picture.svg"><img src="https://example.com:8443/image.jpg"><img src="https://example.com/safe.jpg">]]></content></entry></feed>',
			"https://example.com/feed",
		);
		expect(feed.entries).toHaveLength(2);
		expect(feed.entries[0].imageUrl).toBe("https://example.com/one.jpg");
		expect(feed.entries[1].imageUrl).toBe("https://example.com/safe.jpg");
	});
	test("does not treat a video enclosure or a lazy-load data-src attribute as an image", () => {
		const feed = parseFeed(
			'<rss><channel><item><link>/one</link><media:content type="video/mp4" url="/video.mp4"/><description><![CDATA[<img data-src="/not-the-src.jpg" src="/real.jpg">]]></description></item></channel></rss>',
			"https://example.com/feed",
		);
		expect(feed.entries[0].imageUrl).toBe("https://example.com/real.jpg");
	});
});
