import { describe, expect, test } from "vitest";
import { resolveArticleOgImageUrl } from "./article-og-image-url.js";

describe("article OG image URL resolution", () => {
	test.each([null, undefined, "", "  "])(
		"preserves absent metadata (%s)",
		(value) => {
			expect(
				resolveArticleOgImageUrl(value, "https://example.com/post"),
			).toBeNull();
		},
	);
	test.each([
		["/Owyye/image.png", "https://archive.md/Owyye/image.png"],
		["../image.png", "https://archive.md/image.png"],
		["//cdn.example.com/image.png", "https://cdn.example.com/image.png"],
	])("resolves %s against the article URL", (value, expected) => {
		expect(resolveArticleOgImageUrl(value, "https://archive.md/Owyye")).toBe(
			expected,
		);
	});
	test("preserves long absolute URLs without truncation or re-encoding", () => {
		const value = `https://cdn.example.com/image.png?data=${"%2f".repeat(500)}`;
		expect(resolveArticleOgImageUrl(value, "https://example.com/post")).toBe(
			value,
		);
	});
	test("leaves unsupported schemes for domain validation to reject", () => {
		expect(
			resolveArticleOgImageUrl("javascript:alert(1)", "https://example.com"),
		).toBe("javascript:alert(1)");
	});
});
