import {
	makeBookImagePath,
	makeBookTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/books-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseAddBooksFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("@s-hirano-ist/s-core/books/entities/books-entity");

const mockGetFormDataString = vi.mocked(getFormDataString);
const mockMakeISBN = vi.mocked(makeISBN);
const mockMakeBookTitle = vi.mocked(makeBookTitle);
const mockMakeBookImagePath = vi.mocked(makeBookImagePath);

describe("parseAddBooksFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMakeBookImagePath.mockReturnValue(null as any);
	});

	test("should parse form data and create book data", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code");

		// Mock entity creation
		mockMakeISBN.mockReturnValue("9784123456789" as any);
		mockMakeBookTitle.mockReturnValue("Clean Code" as any);

		const result = await parseAddBooksFormData(formData, userId);

		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "isbn");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "title");

		expect(mockMakeISBN).toHaveBeenCalledWith("9784123456789");
		expect(mockMakeBookTitle).toHaveBeenCalledWith("Clean Code");

		expect(result).toEqual({
			ISBN: "9784123456789",
			title: "Clean Code",
			userId: "test-user-id",
			imagePath: null,
			hasImage: false,
		});
	});

	test("should handle form data with ISBN containing hyphens", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction with hyphenated ISBN
		mockGetFormDataString
			.mockReturnValueOnce("978-4-123-45678-9")
			.mockReturnValueOnce("The Pragmatic Programmer");

		// Mock entity creation
		mockMakeISBN.mockReturnValue("978-4-123-45678-9" as any);
		mockMakeBookTitle.mockReturnValue("The Pragmatic Programmer" as any);

		const result = await parseAddBooksFormData(formData, userId);

		expect(mockMakeISBN).toHaveBeenCalledWith("978-4-123-45678-9");
		expect(mockMakeBookTitle).toHaveBeenCalledWith("The Pragmatic Programmer");

		expect(result).toEqual({
			ISBN: "978-4-123-45678-9",
			title: "The Pragmatic Programmer",
			userId: "test-user-id",
			imagePath: null,
			hasImage: false,
		});
	});

	test("should handle empty form data", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction returning empty strings
		mockGetFormDataString.mockReturnValueOnce("").mockReturnValueOnce("");

		// Mock entity creation
		mockMakeISBN.mockReturnValue("" as any);
		mockMakeBookTitle.mockReturnValue("" as any);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result).toEqual({
			ISBN: "",
			title: "",
			userId: "test-user-id",
			imagePath: null,
			hasImage: false,
		});
	});

	test("should handle form data with Japanese book title", async () => {
		const formData = new FormData();
		const userId = "test-user-id-jp" as any;

		// Mock form data extraction with Japanese content
		mockGetFormDataString
			.mockReturnValueOnce("9784567890123")
			.mockReturnValueOnce("リーダブルコード");

		// Mock entity creation
		mockMakeISBN.mockReturnValue("9784567890123" as any);
		mockMakeBookTitle.mockReturnValue("リーダブルコード" as any);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result).toEqual({
			ISBN: "9784567890123",
			title: "リーダブルコード",
			userId: "test-user-id-jp",
			imagePath: null,
			hasImage: false,
		});
	});

	test("should handle form data with special characters in title", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		// Mock form data extraction with special characters
		mockGetFormDataString
			.mockReturnValueOnce("9784567890123")
			.mockReturnValueOnce('Book Title with "Quotes" & Symbols');

		// Mock entity creation
		mockMakeISBN.mockReturnValue("9784567890123" as any);
		mockMakeBookTitle.mockReturnValue(
			'Book Title with "Quotes" & Symbols' as any,
		);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result).toEqual({
			ISBN: "9784567890123",
			title: 'Book Title with "Quotes" & Symbols',
			userId: "test-user-id",
			imagePath: null,
			hasImage: false,
		});
	});

	test("should handle different user IDs", async () => {
		const formData = new FormData();
		const userId = "different-user-123" as any;

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("9780123456789")
			.mockReturnValueOnce("Design Patterns");

		// Mock entity creation
		mockMakeISBN.mockReturnValue("9780123456789" as any);
		mockMakeBookTitle.mockReturnValue("Design Patterns" as any);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result.userId).toBe("different-user-123");
	});
});
