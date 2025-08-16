import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { addBooks } from "./add-books";

// Mock dependencies

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn().mockResolvedValue({
		success: false,
		message: "Error occurred",
	}),
}));

vi.mock("@/domains/books/services/books-domain-service", () => ({
	BooksDomainService: vi.fn().mockImplementation(() => ({
		prepareNewBook: vi.fn(),
	})),
}));

vi.mock(
	"@/infrastructures/books/repositories/books-command-repository",
	() => ({
		booksCommandRepository: {
			create: vi.fn(),
		},
	}),
);

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {},
}));

const { getSelfId, hasDumperPostPermission } = await import(
	"@/common/auth/session"
);
const { wrapServerSideErrorForClient } = await import(
	"@/common/error/error-wrapper"
);
const { BooksDomainService } = await import(
	"@/domains/books/services/books-domain-service"
);
const { booksCommandRepository } = await import(
	"@/infrastructures/books/repositories/books-command-repository"
);

describe("addBooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "Test Book");

		await expect(addBooks(formData)).rejects.toThrow("FORBIDDEN");
	});

	test("should successfully add books when user has permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const mockPrepareNewBook = vi.fn().mockResolvedValue({
			id: "book-id",
			ISBN: "978-4-06-519981-0",
			title: "Test Book",
			createdBy: "user-123",
		});
		vi.mocked(BooksDomainService).mockImplementation(() => ({
			prepareNewBook: mockPrepareNewBook,
		}));
		vi.mocked(booksCommandRepository.create).mockResolvedValue();

		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "Test Book");

		const result = await addBooks(formData);

		expect(mockPrepareNewBook).toHaveBeenCalledWith(formData, "user-123");
		expect(booksCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({ success: true, message: "inserted" });
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const error = new Error("Domain service error");
		const mockPrepareNewBook = vi.fn().mockRejectedValue(error);
		vi.mocked(BooksDomainService).mockImplementation(() => ({
			prepareNewBook: mockPrepareNewBook,
		}));

		const formData = new FormData();

		const result = await addBooks(formData);

		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(error, formData);
		expect(result).toEqual({ success: false, message: "Error occurred" });
	});
});
