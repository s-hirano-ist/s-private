import type { DeleteArticleDeps } from "./delete-article.deps";
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import { getSelfId, requireAuth } from "@/common/auth/session";
import { makeArticleTitle } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteArticle } from "./delete-article";
import { deleteArticleCore } from "./delete-article.core";

// Minimal mocks - only for auth
vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	requireAuth: vi.fn(),
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
			title: makeArticleTitle("Test Article"),
		});

		const testId = makeId("01234567-89ab-7def-8123-456789abcdef");
		const result = await deleteArticleCore(testId, deps);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			testId,
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
	});

	test("should return error when article not found", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository } = createMockDeps();
		const mockError = new Error("Record not found");
		vi.mocked(mockCommandRepository.deleteById).mockRejectedValue(mockError);

		const testId = makeId("01234567-89ab-7def-8123-456789abcde0");
		const result = await deleteArticleCore(testId, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			testId,
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
	});

	test("should return error when getSelfId fails", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const { deps } = createMockDeps();
		const testId = makeId("01234567-89ab-7def-8123-456789abcdef");
		const result = await deleteArticleCore(testId, deps);

		expect(result.success).toBe(false);
	});
});

describe("deleteArticle (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call deleteArticleCore with default deps when authenticated", async () => {
		vi.mocked(requireAuth).mockResolvedValue(undefined);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteArticle(testId);

		expect(requireAuth).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
