import {
	articleEntity,
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { ArticleCreatedEvent } from "@s-hirano-ist/s-core/articles/events/article-created-event";
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import {
	makeCreatedAt,
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { addArticle } from "./add-article";
import { addArticleCore } from "./add-article.core";
import type { AddArticleDeps } from "./add-article.deps";
import { parseAddArticleFormData } from "./helpers/form-data-parser";

// Minimal mocks - only for auth and form parsing
vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock("./helpers/form-data-parser", () => ({
	parseAddArticleFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Test Article");
mockFormData.append("url", "https://example.com/article");
mockFormData.append("quote", "Test quote");
mockFormData.append("category", "tech");

/**
 * Creates mock dependencies for testing addArticleCore.
 *
 * @param ensureNoDuplicateImpl - Custom implementation for ensureNoDuplicate
 */
function createMockDeps(
	ensureNoDuplicateImpl: () => Promise<void> = async () => {},
): {
	deps: AddArticleDeps;
	mockCommandRepository: IArticlesCommandRepository;
	mockEnsureNoDuplicate: ReturnType<typeof vi.fn>;
	mockResolveOrCreate: ReturnType<typeof vi.fn>;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IArticlesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEnsureNoDuplicate = vi
		.fn()
		.mockImplementation(ensureNoDuplicateImpl);

	const mockResolveOrCreate = vi
		.fn()
		.mockResolvedValue(makeId("01933f5c-9df0-7001-9123-456789abcdef"));

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	// Create a mock domain service factory that returns a mock domain service
	const mockDomainServiceFactory = {
		createArticlesDomainService: () => ({
			ensureNoDuplicate: mockEnsureNoDuplicate,
		}),
		createCategoryService: () => ({
			resolveOrCreate: mockResolveOrCreate,
		}),
		createBooksDomainService: vi.fn(),
		createNotesDomainService: vi.fn(),
	};

	const deps: AddArticleDeps = {
		commandRepository: mockCommandRepository,
		domainServiceFactory:
			mockDomainServiceFactory as unknown as AddArticleDeps["domainServiceFactory"],
		eventDispatcher: mockEventDispatcher,
	};

	return {
		deps,
		mockCommandRepository,
		mockEnsureNoDuplicate,
		mockResolveOrCreate,
		mockEventDispatcher,
	};
}

describe("addArticleCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddArticleFormData).mockReturnValue({
			title: makeArticleTitle("Test Article"),
			url: makeUrl("https://example.com/article"),
			quote: makeQuote("Test quote"),
			categoryName: makeCategoryName("tech"),
			userId: makeUserId("user-123"),
		});
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		const { deps } = createMockDeps();

		const result = await addArticleCore(mockFormData, deps);
		expect(result.success).toBe(false);
	});

	test("should create article successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const {
			deps,
			mockCommandRepository,
			mockEnsureNoDuplicate,
			mockResolveOrCreate,
			mockEventDispatcher,
		} = createMockDeps();

		const mockArticle = {
			id: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			title: makeArticleTitle("Test Article"),
			url: makeUrl("https://example.com/article"),
			quote: makeQuote("Test quote"),
			categoryId: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			userId: makeUserId("user-123"),
			status: makeUnexportedStatus(),
			createdAt: makeCreatedAt(),
		} as const;

		const mockEvent = new ArticleCreatedEvent({
			title: "Test Article",
			url: "https://example.com/article",
			quote: "Test quote",
			categoryName: "tech",
			userId: "user-123",
			caller: "addArticle",
		});

		// Mock articleEntity.create to return tuple
		vi.spyOn(articleEntity, "create").mockReturnValue([mockArticle, mockEvent]);

		const result = await addArticleCore(mockFormData, deps);

		expect(mockEnsureNoDuplicate).toHaveBeenCalledWith(
			makeUrl("https://example.com/article"),
			makeUserId("user-123"),
		);
		expect(mockResolveOrCreate).toHaveBeenCalledWith(
			makeCategoryName("tech"),
			makeUserId("user-123"),
		);
		expect(articleEntity.create).toHaveBeenCalled();
		expect(mockCommandRepository.create).toHaveBeenCalledWith(mockArticle);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(mockEvent);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");

		// Restore original
		vi.mocked(articleEntity.create).mockRestore();
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		// Create deps with ensureNoDuplicate that throws DuplicateError
		const { deps } = createMockDeps(async () => {
			throw new DuplicateError();
		});

		const result = await addArticleCore(mockFormData, deps);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Test Article",
			url: "https://example.com/article",
			quote: "Test quote",
			category: "tech",
		});
	});

	test("should handle unexpected errors", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		// Create deps with ensureNoDuplicate that throws unexpected error
		const { deps } = createMockDeps(async () => {
			throw new Error("Database error");
		});

		const result = await addArticleCore(mockFormData, deps);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});

describe("addArticle (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addArticle(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should call addArticleCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(parseAddArticleFormData).mockReturnValue({
			title: makeArticleTitle("Test Article"),
			url: makeUrl("https://example.com/article"),
			quote: makeQuote("Test quote"),
			categoryName: makeCategoryName("tech"),
			userId: makeUserId("user-123"),
		});

		// This will fail at getSelfId, but it proves the flow works
		const result = await addArticle(mockFormData);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
