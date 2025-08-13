import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		categories: {
			upsert: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import prisma from "@/prisma";
import { categoryCommandRepository } from "./category-command-repository";

describe("CategoryCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("upsert", () => {
		test("should create new category successfully", async () => {
			const mockCategory = {
				id: 1,
				name: "tech",
				userId: "user123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const inputData = {
				name: "tech",
				userId: "user123",
			};

			vi.mocked(prisma.categories.upsert).mockResolvedValue(mockCategory);

			const result = await categoryCommandRepository.upsert(inputData);

			expect(prisma.categories.upsert).toHaveBeenCalledWith({
				where: { name_userId: { userId: "user123", name: "tech" } },
				update: {},
				create: inputData,
			});
			expect(result).toEqual(mockCategory);
		});

		test("should update existing category successfully", async () => {
			const mockCategory = {
				id: 1,
				name: "tech",
				userId: "user123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const inputData = {
				name: "tech",
				userId: "user123",
			};

			vi.mocked(prisma.categories.upsert).mockResolvedValue(mockCategory);

			const result = await categoryCommandRepository.upsert(inputData);

			expect(prisma.categories.upsert).toHaveBeenCalledWith({
				where: { name_userId: { userId: "user123", name: "tech" } },
				update: {},
				create: inputData,
			});
			expect(result).toEqual(mockCategory);
		});

		test("should handle database errors during upsert", async () => {
			const inputData = {
				name: "tech",
				userId: "user123",
			};

			vi.mocked(prisma.categories.upsert).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(categoryCommandRepository.upsert(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.categories.upsert).toHaveBeenCalledWith({
				where: { name_userId: { userId: "user123", name: "tech" } },
				update: {},
				create: inputData,
			});
		});
	});

	describe("deleteById", () => {
		test("should delete category successfully", async () => {
			vi.mocked(prisma.categories.delete).mockResolvedValue({
				id: 1,
				name: "tech",
				userId: "user123",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await categoryCommandRepository.deleteById(1, "user123");

			expect(prisma.categories.delete).toHaveBeenCalledWith({
				where: { id: 1, userId: "user123" },
			});
		});

		test("should handle database errors during delete", async () => {
			vi.mocked(prisma.categories.delete).mockRejectedValue(
				new Error("Category not found"),
			);

			await expect(
				categoryCommandRepository.deleteById(999, "user123"),
			).rejects.toThrow("Category not found");

			expect(prisma.categories.delete).toHaveBeenCalledWith({
				where: { id: 999, userId: "user123" },
			});
		});

		test("should handle foreign key constraint errors", async () => {
			vi.mocked(prisma.categories.delete).mockRejectedValue(
				new Error("Foreign key constraint failed"),
			);

			await expect(
				categoryCommandRepository.deleteById(1, "user123"),
			).rejects.toThrow("Foreign key constraint failed");

			expect(prisma.categories.delete).toHaveBeenCalledWith({
				where: { id: 1, userId: "user123" },
			});
		});
	});
});
