import { describe, expect, test } from "vitest";
import { parseMarkdownFrontmatter } from "./frontmatter.js";

describe("parseMarkdownFrontmatter", () => {
	test("parses BOM, CRLF, collections, quoted colons, and block scalars", () => {
		const parsed = parseMarkdownFrontmatter(
			'\uFEFF---\r\nheading: "Title: details"\r\ntags:\r\n  - one\r\n  - two\r\ndescription: |\r\n  first line\r\n  second line\r\n---\r\n\r\n# Body\r\n',
		);

		expect(parsed.data).toEqual({
			heading: "Title: details",
			tags: ["one", "two"],
			description: "first line\nsecond line\n",
		});
		expect(parsed.content).toBe("\r\n# Body\r\n");
	});

	test("returns content unchanged when frontmatter is absent", () => {
		expect(parseMarkdownFrontmatter("# Body\n")).toEqual({
			content: "# Body\n",
			data: {},
		});
	});

	test("accepts empty frontmatter", () => {
		expect(parseMarkdownFrontmatter("---\n---\nBody")).toEqual({
			content: "Body",
			data: {},
		});
	});

	test("rejects a non-object YAML document", () => {
		expect(() => parseMarkdownFrontmatter("---\n- one\n- two\n---\n")).toThrow(
			"Markdown frontmatter must be a YAML object.",
		);
	});

	test("rejects invalid YAML", () => {
		expect(() => parseMarkdownFrontmatter("---\nkey: [\n---\n")).toThrow(
			/expected|unexpected|indentation/u,
		);
	});

	test("rejects an unclosed frontmatter block", () => {
		expect(() => parseMarkdownFrontmatter("---\nheading: Missing\n")).toThrow(
			"Markdown frontmatter is missing a closing delimiter.",
		);
	});
});
