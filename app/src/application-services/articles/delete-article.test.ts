import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { deleteArticle } from "./delete-article";
import { deleteArticleCore } from "./delete-article.core";
import type { DeleteArticleDeps } from "./delete-article.deps";

// Minimal mocks - only for auth
vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

/**
 * Creates mock dependencies for testing deleteArticleCore.
 */
function createMockDeps(): {
	deps: DeleteArticleDeps;
	mockCommandRepository: IArticlesCommandRepository;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IArticlesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const deps: DeleteArticleDeps = {
		commandRepository: mockCommandRepository,
		eventDispatcher: mockEventDispatcher,
	};

	return { deps, mockCommandRepository, mockEventDispatcher };
}

describe("deleteArticleCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should delete article successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository, mockEventDispatcher } =
			createMockDeps();
		vi.mocked(mockCommandRepository.deleteById).mockResolvedValue({
			title: "Test Article",
		});

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteArticleCore(testId, deps);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
		const status = makeUnexportedStatus();
		expect(revalidateTag).toHaveBeenCalledWith(
			buildContentCacheTag("articles", status, "test-user-id"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			buildCountCacheTag("articles", status, "test-user-id"),
		);
	});

	test("should return error when article not found", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository } = createMockDeps();
		const mockError = new Error("Record not found");
		vi.mocked(mockCommandRepository.deleteById).mockRejectedValue(mockError);

		const testId = "01234567-89ab-7def-8123-456789abcde0";
		const result = await deleteArticleCore(testId, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
	});

	test("should return error when getSelfId fails", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const { deps } = createMockDeps();
		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteArticleCore(testId, deps);

		expect(result.success).toBe(false);
	});
});

describe("deleteArticle (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call forbidden when user lacks permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";
		await expect(deleteArticle(testId)).rejects.toThrow("FORBIDDEN");
	});

	test("should call deleteArticleCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteArticle(testId);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
