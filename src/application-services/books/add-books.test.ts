import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import {
	bookEntity,
	makeBookTitle,
	makeISBN,
} from "@/domains/books/entities/books-entity";
import {
	makeCreatedAt,
	makeId,
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { addBooks } from "./add-books";
import { parseAddBooksFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/books/repositories/books-command-repository",
	() => ({ booksCommandRepository: { create: vi.fn() } }),
);

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {},
}));

const mockEnsureNoDuplicate = vi.fn();

vi.mock("@/domains/books/services/books-domain-service", () => ({
	BooksDomainService: vi.fn().mockImplementation(() => ({
		ensureNoDuplicate: mockEnsureNoDuplicate,
	})),
}));

vi.mock("@/domains/books/entities/books-entity", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		bookEntity: {
			create: vi.fn(),
		},
	};
});

vi.mock("./helpers/form-data-parser", () => ({
	parseAddBooksFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("isbn", "111-2222-3333");
mockFormData.append("title", "Test Book");

describe("addBooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddBooksFormData).mockReturnValue({
			ISBN: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
		});
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addBooks(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addBooks(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create books", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const mockBook = {
			id: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			ISBN: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			status: makeStatus("UNEXPORTED"),
			createdAt: makeCreatedAt(),
		} as const;

		mockEnsureNoDuplicate.mockResolvedValue(undefined);
		vi.mocked(bookEntity.create).mockReturnValue(mockBook);
		vi.mocked(booksCommandRepository.create).mockResolvedValue();

		const result = await addBooks(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(mockEnsureNoDuplicate).toHaveBeenCalledWith(
			makeISBN("978-4-06-519981-0"),
			makeUserId("user-123"),
		);
		expect(bookEntity.create).toHaveBeenCalledWith({
			ISBN: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
		});
		expect(booksCommandRepository.create).toHaveBeenCalledWith(mockBook);
		const status = makeStatus("UNEXPORTED");
		expect(revalidateTag).toHaveBeenCalledWith(
			buildContentCacheTag("books", status, "user-123"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			buildCountCacheTag("books", status, "user-123"),
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");
		mockEnsureNoDuplicate.mockRejectedValue(new DuplicateError());

		const result = await addBooks(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			isbn: "111-2222-3333",
			title: "Test Book",
		});
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const error = new Error("Domain service error");
		mockEnsureNoDuplicate.mockRejectedValue(error);

		const result = await addBooks(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
