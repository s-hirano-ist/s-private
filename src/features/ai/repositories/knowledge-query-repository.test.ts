import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		contents: {
			findMany: vi.fn(),
		},
		books: {
			findMany: vi.fn(),
		},
	},
}));

import prisma from "@/prisma";
import { knowledgeQueryRepository } from "./knowledge-query-repository";

describe("KnowledgeQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findAllContents", () => {
		test("should find all contents for knowledge successfully", async () => {
			const mockContents = [
				{
					title: "Getting Started with AI",
					markdown:
						"# Getting Started with AI\n\nThis is an introduction to AI...",
				},
				{
					title: "Machine Learning Basics",
					markdown: "# Machine Learning Basics\n\nMachine learning is...",
				},
				{
					title: "Deep Learning Guide",
					markdown: "# Deep Learning Guide\n\nDeep learning involves...",
				},
			];

			vi.mocked(prisma.contents.findMany).mockResolvedValue(mockContents);

			const result = await knowledgeQueryRepository.findAllContents(
				"user123",
				"EXPORTED",
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["contents"] },
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle empty contents results", async () => {
			vi.mocked(prisma.contents.findMany).mockResolvedValue([]);

			const result = await knowledgeQueryRepository.findAllContents(
				"user123",
				"EXPORTED",
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["contents"] },
			});
			expect(result).toEqual([]);
		});

		test("should work with different status", async () => {
			const mockContents = [
				{
					title: "Draft Content",
					markdown: "# Draft Content\n\nThis is a draft...",
				},
			];

			vi.mocked(prisma.contents.findMany).mockResolvedValue(mockContents);

			const result = await knowledgeQueryRepository.findAllContents(
				"user123",
				"UNEXPORTED",
			);

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["contents"] },
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.contents.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				knowledgeQueryRepository.findAllContents("user123", "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.contents.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["contents"] },
			});
		});
	});

	describe("findAllBooks", () => {
		test("should find all books for knowledge successfully", async () => {
			const mockBooks = [
				{
					title: "Clean Code",
					markdown:
						"# Clean Code\n\nThis book teaches you how to write clean code...",
					ISBN: "978-0132350884",
				},
				{
					title: "Design Patterns",
					markdown: "# Design Patterns\n\nGang of Four design patterns...",
					ISBN: "978-0201633610",
				},
				{
					title: "Refactoring",
					markdown: "# Refactoring\n\nImproving the design of existing code...",
					ISBN: "978-0134757599",
				},
			];

			vi.mocked(prisma.books.findMany).mockResolvedValue(mockBooks);

			const result = await knowledgeQueryRepository.findAllBooks(
				"user123",
				"EXPORTED",
			);

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true, ISBN: true },
				cacheStrategy: { ttl: 400, tags: ["books"] },
			});
			expect(result).toEqual(mockBooks);
		});

		test("should handle empty books results", async () => {
			vi.mocked(prisma.books.findMany).mockResolvedValue([]);

			const result = await knowledgeQueryRepository.findAllBooks(
				"user123",
				"EXPORTED",
			);

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true, ISBN: true },
				cacheStrategy: { ttl: 400, tags: ["books"] },
			});
			expect(result).toEqual([]);
		});

		test("should work with different status", async () => {
			const mockBooks = [
				{
					title: "Draft Book",
					markdown: "# Draft Book\n\nThis is a draft book...",
					ISBN: "978-0000000000",
				},
			];

			vi.mocked(prisma.books.findMany).mockResolvedValue(mockBooks);

			const result = await knowledgeQueryRepository.findAllBooks(
				"user123",
				"UNEXPORTED",
			);

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
				select: { title: true, markdown: true, ISBN: true },
				cacheStrategy: { ttl: 400, tags: ["books"] },
			});
			expect(result).toEqual(mockBooks);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.books.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				knowledgeQueryRepository.findAllBooks("user123", "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { title: true, markdown: true, ISBN: true },
				cacheStrategy: { ttl: 400, tags: ["books"] },
			});
		});
	});
});
