import { decodeFeedXml } from "@s-hirano-ist/s-infrastructure/rss/decode";
import { parseFeed } from "@s-hirano-ist/s-infrastructure/rss/parser";
import { expect, test } from "vitest";
function fixture(encoding: string, hex: string) {
	return Buffer.concat([
		Buffer.from(
			`<?xml version="1.0" encoding="${encoding}"?><rss><channel><title>`,
		),
		Buffer.from(hex, "hex"),
		Buffer.from(
			"</title><item><title>Article</title><link>https://example.com/one</link></item></channel></rss>",
		),
	]);
}
test.each([
	["Shift_JIS", "93fa967b8cea"],
	["windows-31j", "93fa967b8cea"],
	["EUC-JP", "c6fccbdcb8ec"],
])("decodes Japanese XML declared as %s before parsing", (label, hex) => {
	const xml = decodeFeedXml(fixture(label, hex));
	expect(parseFeed(xml, "https://example.com").title).toBe("日本語");
});
test("HTTP charset takes precedence over a conflicting XML declaration", () => {
	const xml = decodeFeedXml(
		fixture("UTF-8", "93fa967b8cea"),
		'application/rss+xml; CHARSET="Shift_JIS"',
	);
	expect(parseFeed(xml, "https://example.com").title).toBe("日本語");
});
test.each([
	["utf-8", Buffer.from('\uFEFF<?xml version="1.0"?><rss/>')],
	["utf-16le", Buffer.from('\uFEFF<?xml version="1.0"?><rss/>', "utf16le")],
	[
		"utf-16be",
		Buffer.from('\uFEFF<?xml version="1.0"?><rss/>', "utf16le").swap16(),
	],
])("%s BOM overrides an incorrect HTTP charset", (_label, bytes) => {
	expect(decodeFeedXml(bytes, "application/xml; charset=shift_jis")).toBe(
		'<?xml version="1.0"?><rss/>',
	);
});
test.each([
	Buffer.from('<?xml version="1.0" encoding="UTF-16"?><rss/>', "utf16le"),
	Buffer.from(
		'<?xml version="1.0" encoding="UTF-16"?><rss/>',
		"utf16le",
	).swap16(),
])("recognizes UTF-16 byte order without a BOM", (bytes) => {
	expect(decodeFeedXml(bytes)).toBe(
		'<?xml version="1.0" encoding="UTF-16"?><rss/>',
	);
});
test("uses UTF-8 when undeclared, retaining Japanese characters", () => {
	expect(decodeFeedXml(Buffer.from("<rss>日本語</rss>"))).toBe(
		"<rss>日本語</rss>",
	);
	expect(decodeFeedXml(Buffer.from("<rss/>"), "malformed content type")).toBe(
		"<rss/>",
	);
});
test("rejects unknown charsets and invalid sequences instead of persisting replacement characters", () => {
	expect(() =>
		decodeFeedXml(fixture("unknown-encoding", "93fa967b8cea")),
	).toThrow(RangeError);
	expect(() => decodeFeedXml(Buffer.from([0xff]))).toThrow(TypeError);
	expect(() =>
		decodeFeedXml(Buffer.from([0x82]), "application/xml; charset=shift_jis"),
	).toThrow(TypeError);
	expect(() => decodeFeedXml(Buffer.from("fffe00003c000000", "hex"))).toThrow(
		RangeError,
	);
});
