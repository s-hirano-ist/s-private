import {
	type BookTitle,
	type ISBN,
	makeBookTitle,
	makeISBN,
	makeRating,
	makeTags,
	type Rating,
	type Tags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseAddBooksFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("@s-hirano-ist/s-core/books/entities/book-entity");

const mockGetFormDataString = vi.mocked(getFormDataString);
const mockMakeISBN = vi.mocked(makeISBN);
const mockMakeBookTitle = vi.mocked(makeBookTitle);
const mockMakeRating = vi.mocked(makeRating);
const mockMakeTags = vi.mocked(makeTags);

describe("parseAddBooksFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMakeRating.mockImplementation((n) => n as Rating);
		mockMakeTags.mockImplementation((arr) => arr as unknown as Tags);
	});

	test("should parse form data and create book data", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("5")
			.mockReturnValueOnce("programming, design");

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Clean Code" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "isbn");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "title");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "rating");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "tags");

		expect(mockMakeISBN).toHaveBeenCalledWith("9784123456789");
		expect(mockMakeBookTitle).toHaveBeenCalledWith("Clean Code");
		expect(mockMakeRating).toHaveBeenCalledWith(5);
		expect(mockMakeTags).toHaveBeenCalledWith(["programming", "design"]);

		expect(result).toMatchObject({
			isbn: "9784123456789",
			title: "Clean Code",
			rating: 5,
			tags: ["programming", "design"],
			userId: "test-user-id",
			imagePath: undefined,
			hasImage: false,
		});
	});

	test("should treat empty tags input as empty array", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("3")
			.mockReturnValueOnce("");

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Clean Code" as BookTitle);

		await parseAddBooksFormData(formData, userId);

		expect(mockMakeTags).toHaveBeenCalledWith([]);
	});

	test("should trim and drop blank tag entries", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("4")
			.mockReturnValueOnce("  a ,, b  ,  ");

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Clean Code" as BookTitle);

		await parseAddBooksFormData(formData, userId);

		expect(mockMakeTags).toHaveBeenCalledWith(["a", "b"]);
	});

	test("should handle form data with ISBN containing hyphens", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("978-4-123-45678-9")
			.mockReturnValueOnce("The Pragmatic Programmer")
			.mockReturnValueOnce("5")
			.mockReturnValueOnce("classics");

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("The Pragmatic Programmer" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(mockMakeISBN).toHaveBeenCalledWith("978-4-123-45678-9");
		expect(mockMakeBookTitle).toHaveBeenCalledWith("The Pragmatic Programmer");
		expect(result).toMatchObject({
			isbn: "9784123456789",
			title: "The Pragmatic Programmer",
			rating: 5,
			tags: ["classics"],
			userId: "test-user-id",
			imagePath: undefined,
			hasImage: false,
		});
	});

	test("should handle form data with Japanese book title", async () => {
		const formData = new FormData();
		const userId = "test-user-id-jp" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784567890123")
			.mockReturnValueOnce("リーダブルコード")
			.mockReturnValueOnce("4")
			.mockReturnValueOnce("コード品質");

		mockMakeISBN.mockReturnValue("9784567890123" as ISBN);
		mockMakeBookTitle.mockReturnValue("リーダブルコード" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result).toMatchObject({
			isbn: "9784567890123",
			title: "リーダブルコード",
			rating: 4,
			tags: ["コード品質"],
			userId: "test-user-id-jp",
			imagePath: undefined,
			hasImage: false,
		});
	});

	test("should handle different user IDs", async () => {
		const formData = new FormData();
		const userId = "different-user-123" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9780123456789")
			.mockReturnValueOnce("Design Patterns")
			.mockReturnValueOnce("5")
			.mockReturnValueOnce("");

		mockMakeISBN.mockReturnValue("9780123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Design Patterns" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result.userId).toBe("different-user-123");
	});
});
