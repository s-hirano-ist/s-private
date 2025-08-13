import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		categories: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

import prisma from "@/prisma";
import { categoryQueryRepository } from "./category-query-repository";

describe("CategoryQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findById", () => {
		test("should find category by name and userId", async () => {
			const mockCategory = {
				id: 1,
				name: "tech",
				userId: "user123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.categories.findUnique).mockResolvedValue(mockCategory);

			const result = await categoryQueryRepository.findById("tech", "user123");

			expect(prisma.categories.findUnique).toHaveBeenCalledWith({
				where: { name_userId: { name: "tech", userId: "user123" } },
			});
			expect(result).toEqual(mockCategory);
		});

		test("should return null when category not found", async () => {
			vi.mocked(prisma.categories.findUnique).mockResolvedValue(null);

			const result = await categoryQueryRepository.findById(
				"nonexistent",
				"user123",
			);

			expect(prisma.categories.findUnique).toHaveBeenCalledWith({
				where: { name_userId: { name: "nonexistent", userId: "user123" } },
			});
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.categories.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				categoryQueryRepository.findById("tech", "user123"),
			).rejects.toThrow("Database error");

			expect(prisma.categories.findUnique).toHaveBeenCalledWith({
				where: { name_userId: { name: "tech", userId: "user123" } },
			});
		});
	});

	describe("findMany", () => {
		test("should find multiple categories successfully", async () => {
			const mockCategories = [
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
				{ id: 3, name: "politics" },
			];

			vi.mocked(prisma.categories.findMany).mockResolvedValue(mockCategories);

			const params = {
				orderBy: { name: "asc" as const },
				take: 10,
				skip: 0,
			};

			const result = await categoryQueryRepository.findMany("user123", params);

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
				...params,
			});
			expect(result).toEqual(mockCategories);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.categories.findMany).mockResolvedValue([]);

			const result = await categoryQueryRepository.findMany("user123");

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
			expect(result).toEqual([]);
		});

		test("should work without parameters", async () => {
			const mockCategories = [
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
			];

			vi.mocked(prisma.categories.findMany).mockResolvedValue(mockCategories);

			const result = await categoryQueryRepository.findMany("user123");

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
			expect(result).toEqual(mockCategories);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.categories.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(categoryQueryRepository.findMany("user123")).rejects.toThrow(
				"Database connection error",
			);

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
		});
	});
});
