import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { addBooks } from "./add-books";

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

const mockPrepareNewBook = vi.fn();

vi.mock("@/domains/books/services/books-domain-service", () => ({
	BooksDomainService: vi.fn().mockImplementation(() => ({
		prepareNewBook: mockPrepareNewBook,
	})),
}));

const mockFormData = new FormData();
mockFormData.append("isbn", "111-2222-3333");
mockFormData.append("title", "Test Book");

describe("addBooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

		mockPrepareNewBook.mockResolvedValue({
			id: "01234567-89ab-4def-9123-456789abcdef",
			isbn: "978-4-06-519981-0",
			title: "Test Book",
			userId: "user-123",
		});
		vi.mocked(booksCommandRepository.create).mockResolvedValue();

		const result = await addBooks(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(mockPrepareNewBook).toHaveBeenCalledWith(mockFormData, "user-123");
		expect(booksCommandRepository.create).toHaveBeenCalled();
		expect(revalidateTag).toHaveBeenCalledWith("books_UNEXPORTED_user-123");

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");
		mockPrepareNewBook.mockRejectedValue(new DuplicateError());

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
		mockPrepareNewBook.mockRejectedValue(error);

		const result = await addBooks(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
