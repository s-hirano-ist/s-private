import {
	bookEntity,
	makeBookTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/books-entity";
import { BookCreatedEvent } from "@s-hirano-ist/s-core/books/events/book-created-event";
import { DuplicateError } from "@s-hirano-ist/s-core/errors/error-classes";
import {
	makeCreatedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
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

vi.mock("@/infrastructures/events/event-dispatcher", () => ({
	eventDispatcher: {
		dispatch: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {},
}));

const mockEnsureNoDuplicate = vi.fn();

vi.mock("@s-hirano-ist/s-core/books/services/books-domain-service", () => ({
	BooksDomainService: class {
		ensureNoDuplicate = mockEnsureNoDuplicate;
	},
}));

vi.mock(
	"@s-hirano-ist/s-core/books/entities/books-entity",
	async (importOriginal) => {
		const actual = (await importOriginal()) as any;
		return {
			...actual,
			bookEntity: {
				create: vi.fn(),
			},
		};
	},
);

vi.mock("./helpers/form-data-parser", () => ({
	parseAddBooksFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("isbn", "111-2222-3333");
mockFormData.append("title", "Test Book");

describe("addBooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddBooksFormData).mockResolvedValue({
			ISBN: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			imagePath: undefined,
			hasImage: false as const,
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
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const mockBook = {
			id: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			ISBN: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			status: "UNEXPORTED",
			createdAt: makeCreatedAt(),
			imagePath: undefined,
		} as const;

		const mockEvent = new BookCreatedEvent({
			ISBN: "978-4-06-519981-0",
			title: "Test Book",
			userId: "user-123",
			caller: "addBooks",
		});

		mockEnsureNoDuplicate.mockResolvedValue(undefined);
		vi.mocked(bookEntity.create).mockReturnValue([mockBook, mockEvent]);
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
			imagePath: undefined,
			caller: "addBooks",
		});
		expect(booksCommandRepository.create).toHaveBeenCalledWith(mockBook);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));
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
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const error = new Error("Domain service error");
		mockEnsureNoDuplicate.mockRejectedValue(error);

		const result = await addBooks(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
