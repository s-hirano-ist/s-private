import { describe, expect, test } from "vitest";
import {
	decodeHtml,
	detectHtmlCharset,
	normalizeCharset,
} from "./html-charset.js";

describe("HTML charset handling", () => {
	test("normalizes legacy aliases", () => {
		expect(normalizeCharset("Shift-JIS")).toBe("shift_jis");
		expect(normalizeCharset("x-euc-jp")).toBe("euc-jp");
	});

	test("prefers the response header over a meta tag", () => {
		const bytes = new TextEncoder().encode('<meta charset="utf-8">');
		const headers = new Headers({
			"content-type": 'text/html; charset="Shift_JIS"',
		});

		expect(detectHtmlCharset(headers, bytes)).toBe("shift_jis");
	});

	test("detects a legacy http-equiv declaration", () => {
		const bytes = new TextEncoder().encode(
			'<meta http-equiv="Content-Type" content="text/html; charset=EUC-JP">',
		);

		expect(detectHtmlCharset(new Headers(), bytes)).toBe("euc-jp");
	});

	test("decodes Shift_JIS and EUC-JP using the Node runtime", () => {
		expect(
			decodeHtml(
				new Headers({ "content-type": "text/html; charset=Shift_JIS" }),
				Uint8Array.from([0x93, 0xfa, 0x96, 0x7b]),
			),
		).toBe("日本");
		expect(
			decodeHtml(
				new Headers({ "content-type": "text/html; charset=EUC-JP" }),
				Uint8Array.from([0xc6, 0xfc, 0xcb, 0xdc]),
			),
		).toBe("日本");
	});

	test("fails explicitly for an unsupported charset", () => {
		expect(() =>
			decodeHtml(
				new Headers({ "content-type": "text/html; charset=unknown-encoding" }),
				new Uint8Array(),
			),
		).toThrow(RangeError);
	});
});
