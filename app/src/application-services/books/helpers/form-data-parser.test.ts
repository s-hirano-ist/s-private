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
import {
	type ContentType,
	type FileSize,
	makeContentType,
	makeFileSize,
	makePath,
	type Path,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	getFormDataFile,
	getFormDataString,
} from "@/common/utils/form-data-utils";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { parseAddBooksFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("@s-hirano-ist/s-core/books/entities/book-entity");
vi.mock("@s-hirano-ist/s-core/shared-kernel/entities/file-entity");
vi.mock("@/infrastructures/images/services/sharp-image-processor", () => ({
	sharpImageProcessor: {
		fileToBuffer: vi.fn(),
		createThumbnail: vi.fn(),
	},
}));

const mockGetFormDataString = vi.mocked(getFormDataString);
const mockGetFormDataFile = vi.mocked(getFormDataFile);
const mockMakeISBN = vi.mocked(makeISBN);
const mockMakeBookTitle = vi.mocked(makeBookTitle);
const mockMakeRating = vi.mocked(makeRating);
const mockMakeTags = vi.mocked(makeTags);
const mockMakePath = vi.mocked(makePath);
const mockMakeContentType = vi.mocked(makeContentType);
const mockMakeFileSize = vi.mocked(makeFileSize);
const mockFileToBuffer = vi.mocked(sharpImageProcessor.fileToBuffer);
const mockCreateThumbnail = vi.mocked(sharpImageProcessor.createThumbnail);

const buildMockFile = (
	name = "cover.jpg",
	type = "image/jpeg",
	size = 1024,
): File => {
	const file = new File([new Uint8Array(size)], name, { type });
	return file;
};

describe("parseAddBooksFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMakeRating.mockImplementation((n) => n as Rating);
		mockMakeTags.mockImplementation((arr) => arr as unknown as Tags);
		mockMakePath.mockImplementation((v) => v as Path);
		mockMakeContentType.mockImplementation((v) => v as ContentType);
		mockMakeFileSize.mockImplementation((v) => v as FileSize);
		mockFileToBuffer.mockResolvedValue(Buffer.from([1, 2, 3]));
		mockCreateThumbnail.mockResolvedValue(Buffer.from([4, 5, 6]));
	});

	test("should parse form data with image and create book data", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;
		const file = buildMockFile();

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("5")
			.mockReturnValueOnce("programming, design");
		mockGetFormDataFile.mockReturnValueOnce(file);

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Clean Code" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "isbn");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "title");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "rating");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "tags");
		expect(mockGetFormDataFile).toHaveBeenCalledWith(formData, "image");

		expect(mockMakeISBN).toHaveBeenCalledWith("9784123456789");
		expect(mockMakeBookTitle).toHaveBeenCalledWith("Clean Code");
		expect(mockMakeRating).toHaveBeenCalledWith(5);
		expect(mockMakeTags).toHaveBeenCalledWith(["programming", "design"]);
		expect(mockMakePath).toHaveBeenCalledWith("cover.jpg", true);
		expect(mockMakeContentType).toHaveBeenCalledWith("image/jpeg");
		expect(mockMakeFileSize).toHaveBeenCalledWith(1024);

		expect(result).toMatchObject({
			isbn: "9784123456789",
			title: "Clean Code",
			rating: 5,
			tags: ["programming", "design"],
			userId: "test-user-id",
			imagePath: "cover.jpg",
			path: "cover.jpg",
			contentType: "image/jpeg",
			fileSize: 1024,
		});
	});

	test("should propagate error when image is missing", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("5")
			.mockReturnValueOnce("programming");
		mockGetFormDataFile.mockImplementationOnce(() => {
			throw new Error("InvalidFormatError");
		});

		mockMakeISBN.mockReturnValue("9784123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Clean Code" as BookTitle);

		await expect(parseAddBooksFormData(formData, userId)).rejects.toThrow(
			"InvalidFormatError",
		);
	});

	test("should treat empty tags input as empty array", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as UserId;

		mockGetFormDataString
			.mockReturnValueOnce("9784123456789")
			.mockReturnValueOnce("Clean Code")
			.mockReturnValueOnce("3")
			.mockReturnValueOnce("");
		mockGetFormDataFile.mockReturnValueOnce(buildMockFile());

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
		mockGetFormDataFile.mockReturnValueOnce(buildMockFile());

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
		mockGetFormDataFile.mockReturnValueOnce(buildMockFile());

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
		mockGetFormDataFile.mockReturnValueOnce(buildMockFile());

		mockMakeISBN.mockReturnValue("9784567890123" as ISBN);
		mockMakeBookTitle.mockReturnValue("リーダブルコード" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result).toMatchObject({
			isbn: "9784567890123",
			title: "リーダブルコード",
			rating: 4,
			tags: ["コード品質"],
			userId: "test-user-id-jp",
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
		mockGetFormDataFile.mockReturnValueOnce(buildMockFile());

		mockMakeISBN.mockReturnValue("9780123456789" as ISBN);
		mockMakeBookTitle.mockReturnValue("Design Patterns" as BookTitle);

		const result = await parseAddBooksFormData(formData, userId);

		expect(result.userId).toBe("different-user-123");
	});
});
