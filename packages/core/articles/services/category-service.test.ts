import type { ICategoryCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/category-command-repository.interface";
import type { ICategoryQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/category-query-repository.interface";
import { makeCategoryName } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { CategoryService } from "@s-hirano-ist/s-core/articles/services/category-service";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("CategoryService", () => {
	let categoryQueryRepository: ICategoryQueryRepository;
	let categoryCommandRepository: ICategoryCommandRepository;
	let categoryService: CategoryService;

	beforeEach(() => {
		categoryQueryRepository = {
			findByNameAndUser: vi.fn(),
		} as ICategoryQueryRepository;

		categoryCommandRepository = {
			create: vi.fn(),
		};

		categoryService = new CategoryService(
			categoryQueryRepository,
			categoryCommandRepository,
		);
	});

	describe("resolveOrCreate", () => {
		test("should return existing category ID when category is found", async () => {
			const categoryName = makeCategoryName("Tech");
			const userId = makeUserId("test-user-id");
			const existingId = makeId();

			vi.mocked(categoryQueryRepository.findByNameAndUser).mockResolvedValue({
				id: existingId,
				name: categoryName,
				userId,
			});

			const result = await categoryService.resolveOrCreate(
				categoryName,
				userId,
			);

			expect(result).toBe(existingId);
			expect(categoryQueryRepository.findByNameAndUser).toHaveBeenCalledWith(
				categoryName,
				userId,
			);
			expect(categoryCommandRepository.create).not.toHaveBeenCalled();
		});

		test("should create new category and return ID when category does not exist", async () => {
			const categoryName = makeCategoryName("NewCategory");
			const userId = makeUserId("test-user-id");

			vi.mocked(categoryQueryRepository.findByNameAndUser).mockResolvedValue(
				null,
			);
			vi.mocked(categoryCommandRepository.create).mockResolvedValue(undefined);

			const result = await categoryService.resolveOrCreate(
				categoryName,
				userId,
			);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(categoryQueryRepository.findByNameAndUser).toHaveBeenCalledWith(
				categoryName,
				userId,
			);
			expect(categoryCommandRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: categoryName,
					userId,
				}),
			);
		});

		test("should return existing ID on race condition retry", async () => {
			const categoryName = makeCategoryName("RaceCategory");
			const userId = makeUserId("test-user-id");
			const existingId = makeId();

			vi.mocked(categoryQueryRepository.findByNameAndUser)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					id: existingId,
					name: categoryName,
					userId,
				});

			vi.mocked(categoryCommandRepository.create).mockRejectedValue(
				new Error("Duplicate key error"),
			);

			const result = await categoryService.resolveOrCreate(
				categoryName,
				userId,
			);

			expect(result).toBe(existingId);
			expect(categoryQueryRepository.findByNameAndUser).toHaveBeenCalledTimes(
				2,
			);
			expect(categoryCommandRepository.create).toHaveBeenCalled();
		});

		test("should re-throw error when retry also fails to find category", async () => {
			const categoryName = makeCategoryName("FailCategory");
			const userId = makeUserId("test-user-id");
			const originalError = new Error("Database error");

			vi.mocked(categoryQueryRepository.findByNameAndUser).mockResolvedValue(
				null,
			);
			vi.mocked(categoryCommandRepository.create).mockRejectedValue(
				originalError,
			);

			await expect(
				categoryService.resolveOrCreate(categoryName, userId),
			).rejects.toThrow(originalError);

			expect(categoryQueryRepository.findByNameAndUser).toHaveBeenCalledTimes(
				2,
			);
			expect(categoryCommandRepository.create).toHaveBeenCalled();
		});
	});
});
