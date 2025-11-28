import { makeMarkdown, makeNoteTitle } from "s-core/notes/entities/note-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseAddNoteFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("s-core/notes/entities/note-entity");

const mockGetFormDataString = vi.mocked(getFormDataString);
const mockMakeNoteTitle = vi.mocked(makeNoteTitle);
const mockMakeMarkdown = vi.mocked(makeMarkdown);

describe("parseAddNoteFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should parse form data and create note data", () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("Test Note Title")
			.mockReturnValueOnce("# Test Note\n\nThis is test markdown content.");

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue("Test Note Title" as any);
		mockMakeMarkdown.mockReturnValue(
			"# Test Note\n\nThis is test markdown content." as any,
		);

		const result = parseAddNoteFormData(formData, userId);

		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "title");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "markdown");

		expect(mockMakeNoteTitle).toHaveBeenCalledWith("Test Note Title");
		expect(mockMakeMarkdown).toHaveBeenCalledWith(
			"# Test Note\n\nThis is test markdown content.",
		);

		expect(result).toEqual({
			title: "Test Note Title",
			markdown: "# Test Note\n\nThis is test markdown content.",
			userId: "test-user-id",
		});
	});

	test("should handle empty form data", () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction returning empty strings
		mockGetFormDataString.mockReturnValueOnce("").mockReturnValueOnce("");

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue("" as any);
		mockMakeMarkdown.mockReturnValue("" as any);

		const result = parseAddNoteFormData(formData, userId);

		expect(result).toEqual({
			title: "",
			markdown: "",
			userId: "test-user-id",
		});
	});

	test("should handle form data with complex markdown", () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const complexMarkdown = `# Main Title

## Subtitle

Here's some text with **bold** and *italic*.

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

- List item 1
- List item 2
  - Nested item

> This is a blockquote

[Link text](https://example.com)`;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("Complex Note")
			.mockReturnValueOnce(complexMarkdown);

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue("Complex Note" as any);
		mockMakeMarkdown.mockReturnValue(complexMarkdown as any);

		const result = parseAddNoteFormData(formData, userId);

		expect(result).toEqual({
			title: "Complex Note",
			markdown: complexMarkdown,
			userId: "test-user-id",
		});
	});

	test("should handle form data with Japanese content", () => {
		const formData = new FormData();
		const userId = "test-user-id-jp" as any;

		const japaneseMarkdown = `# テストノート

これは日本語のマークダウンです。

## セクション

- アイテム1
- アイテム2

**太字**と*斜体*のテキスト。`;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("テストノートタイトル")
			.mockReturnValueOnce(japaneseMarkdown);

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue("テストノートタイトル" as any);
		mockMakeMarkdown.mockReturnValue(japaneseMarkdown as any);

		const result = parseAddNoteFormData(formData, userId);

		expect(result).toEqual({
			title: "テストノートタイトル",
			markdown: japaneseMarkdown,
			userId: "test-user-id-jp",
		});
	});

	test("should handle form data with special characters", () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const markdownWithSpecialChars = `# Title with "Quotes" & Symbols

Content with <tags>, & ampersands, and "quotes".

\`\`\`html
<div class="example">
  <p>HTML content & entities</p>
</div>
\`\`\``;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce('Note with "Special" Characters')
			.mockReturnValueOnce(markdownWithSpecialChars);

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue('Note with "Special" Characters' as any);
		mockMakeMarkdown.mockReturnValue(markdownWithSpecialChars as any);

		const result = parseAddNoteFormData(formData, userId);

		expect(result).toEqual({
			title: 'Note with "Special" Characters',
			markdown: markdownWithSpecialChars,
			userId: "test-user-id",
		});
	});

	test("should handle different user IDs", () => {
		const formData = new FormData();
		const userId = "different-user-456" as any;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("User Specific Note")
			.mockReturnValueOnce("# Note for different user");

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue("User Specific Note" as any);
		mockMakeMarkdown.mockReturnValue("# Note for different user" as any);

		const result = parseAddNoteFormData(formData, userId);

		expect(result.userId).toBe("different-user-456");
	});

	test("should handle very long markdown content", () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const longMarkdown = makeMarkdown(
			`# Long Content\n\n${"Text ".repeat(1000)}`,
		);

		const longNoteTitle = makeNoteTitle("Long Note");

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce(longNoteTitle)
			.mockReturnValueOnce(longMarkdown);

		// Mock entity creation
		mockMakeNoteTitle.mockReturnValue(longNoteTitle);
		mockMakeMarkdown.mockReturnValue(longMarkdown);

		const result = parseAddNoteFormData(formData, userId);

		expect(result.markdown).toBe(longMarkdown);
		expect(mockMakeMarkdown).toHaveBeenCalledWith(longMarkdown);
	});
});
