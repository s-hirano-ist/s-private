import {
	bookEntity,
	makeBookTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import { BookCreatedEvent } from "@s-hirano-ist/s-core/books/events/book-created-event";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import {
	makeCreatedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { addBooks } from "./add-books";
import { addBooksCore } from "./add-books.core";
import type { AddBooksDeps } from "./add-books.deps";
import { parseAddBooksFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock("./helpers/form-data-parser", () => ({
	parseAddBooksFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("isbn", "111-2222-3333");
mockFormData.append("title", "Test Book");

function createMockDeps(
	ensureNoDuplicateImpl: () => Promise<void> = async () => {},
): {
	deps: AddBooksDeps;
	mockCommandRepository: IBooksCommandRepository;
	mockStorageService: IStorageService;
	mockEnsureNoDuplicate: ReturnType<typeof vi.fn>;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IBooksCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockStorageService: IStorageService = {
		uploadImage: vi.fn(),
		getImage: vi.fn(),
		getImageOrThrow: vi.fn(),
		deleteImage: vi.fn(),
	};

	const mockEnsureNoDuplicate = vi
		.fn()
		.mockImplementation(ensureNoDuplicateImpl);

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const mockDomainServiceFactory = {
		createBooksDomainService: () => ({
			ensureNoDuplicate: mockEnsureNoDuplicate,
		}),
		createArticlesDomainService: vi.fn(),
		createNotesDomainService: vi.fn(),
		createImagesDomainService: vi.fn(),
		createCategoryService: vi.fn(),
	};

	const deps: AddBooksDeps = {
		commandRepository: mockCommandRepository,
		storageService: mockStorageService,
		domainServiceFactory:
			mockDomainServiceFactory as unknown as AddBooksDeps["domainServiceFactory"],
		eventDispatcher: mockEventDispatcher,
	};

	return {
		deps,
		mockCommandRepository,
		mockStorageService,
		mockEnsureNoDuplicate,
		mockEventDispatcher,
	};
}

describe("addBooksCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddBooksFormData).mockResolvedValue({
			isbn: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			imagePath: undefined,
			hasImage: false as const,
		});
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		const { deps } = createMockDeps();

		const result = await addBooksCore(mockFormData, deps);

		expect(result.success).toBe(false);
	});

	test("should create book successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const {
			deps,
			mockCommandRepository,
			mockEnsureNoDuplicate,
			mockEventDispatcher,
		} = createMockDeps();

		const mockBook = {
			id: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			isbn: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			status: "UNEXPORTED",
			createdAt: makeCreatedAt(),
			imagePath: undefined,
		} as const;

		const mockEvent = new BookCreatedEvent({
			isbn: "978-4-06-519981-0",
			title: "Test Book",
			userId: "user-123",
			caller: "addBooks",
		});

		vi.spyOn(bookEntity, "create").mockReturnValue([mockBook, mockEvent]);

		const result = await addBooksCore(mockFormData, deps);

		expect(mockEnsureNoDuplicate).toHaveBeenCalledWith(
			makeISBN("978-4-06-519981-0"),
			makeUserId("user-123"),
		);
		expect(bookEntity.create).toHaveBeenCalledWith({
			isbn: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			imagePath: undefined,
			caller: "addBooks",
		});
		expect(mockCommandRepository.create).toHaveBeenCalledWith(mockBook);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(mockEvent);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");

		vi.mocked(bookEntity.create).mockRestore();
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const { deps } = createMockDeps(async () => {
			throw new DuplicateError();
		});

		const result = await addBooksCore(mockFormData, deps);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			isbn: "111-2222-3333",
			title: "Test Book",
		});
	});

	test("should handle unexpected errors", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const { deps } = createMockDeps(async () => {
			throw new Error("Database error");
		});

		const result = await addBooksCore(mockFormData, deps);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});

describe("addBooks (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addBooks(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should call addBooksCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(parseAddBooksFormData).mockResolvedValue({
			isbn: makeISBN("978-4-06-519981-0"),
			title: makeBookTitle("Test Book"),
			userId: makeUserId("user-123"),
			imagePath: undefined,
			hasImage: false as const,
		});

		const result = await addBooks(mockFormData);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
