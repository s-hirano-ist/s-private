import { beforeEach, describe, expect, test, vi } from "vitest";

import prisma from "@/prisma";
import { contentsQueryRepository } from "./contents-query-repository";

describe("ContentsQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findByTitle", () => {
		test("should find contents by title, userId", async () => {
			const mockContents = {
				id: 1,
				title: "Test Content",
				markdown: "# Test Content\n\nThis is test markdown content.",
			};

			vi.mocked(prisma.contents.findUnique).mockResolvedValue(mockContents);

			const result = await contentsQueryRepository.findByTitle(
				"Test Content",
				"user123",
			);

			expect(prisma.contents.findUnique).toHaveBeenCalledWith({
				where: { title_userId: { title: "Test Content", userId: "user123" } },
				select: { id: true, title: true, markdown: true },
			});
			expect(result).toEqual(mockContents.markdown);
		});

		test("should return null when contents not found", async () => {
			vi.mocked(prisma.contents.findUnique).mockResolvedValue(null);

			const result = await contentsQueryRepository.findByTitle(
				"Nonexistent Content",
				"user123",
			);

			expect(prisma.contents.findUnique).toHaveBeenCalledWith({
				where: {
					title_userId: { title: "Nonexistent Content", userId: "user123" },
				},
				select: { id: true, title: true, markdown: true },
			});
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.contents.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				contentsQueryRepository.findByTitle("Test Content", "user123"),
			).rejects.toThrow("Database error");

			expect(prisma.contents.findUnique).toHaveBeenCalledWith({
				where: { title_userId: { title: "Test Content", userId: "user123" } },
				select: { id: true, title: true, markdown: true },
			});
		});
	});

	describe("findMany", () => {
		test("should find multiple contents successfully", async () => {
			const mockContents = [
				{ id: 1, title: "First Content" },
				{ id: 2, title: "Second Content" },
				{ id: 3, title: "Third Content" },
			];

			vi.mocked(prisma.contents.findMany).mockResolvedValue(mockContents);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await contentsQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
				...params,
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.contents.findMany).mockResolvedValue([]);

			const result = await contentsQueryRepository.findMany(
				"user123",
				"EXPORTED",
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
			});
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockContents = [{ id: 1, title: "Cached Content" }];

			vi.mocked(prisma.contents.findMany).mockResolvedValue(mockContents);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["contents"] },
			};

			const result = await contentsQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
				cacheStrategy: { ttl: 300, swr: 30, tags: ["contents"] },
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.contents.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				contentsQueryRepository.findMany("user123", "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
			});
		});
	});

	describe("count", () => {
		test("should return count of contents", async () => {
			vi.mocked(prisma.contents.count).mockResolvedValue(15);

			const result = await contentsQueryRepository.count("user123", "EXPORTED");

			expect(prisma.contents.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.contents.count).mockResolvedValue(0);

			const result = await contentsQueryRepository.count(
				"user123",
				"UNEXPORTED",
			);

			expect(prisma.contents.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.contents.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				contentsQueryRepository.count("user123", "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.contents.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});
});
