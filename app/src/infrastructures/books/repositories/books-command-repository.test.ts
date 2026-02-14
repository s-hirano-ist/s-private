import {
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleAuthors,
	makeGoogleDescription,
	makeGoogleHref,
	makeGoogleImgSrc,
	makeGoogleSubTitle,
	makeGoogleTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeCreatedAt,
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { booksCommandRepository } from "./books-command-repository";

describe("BooksCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create book successfully", async () => {
			vi.mocked(prisma.book.create).mockResolvedValue({
				id: "1",
				userId: "user123",
				isbn: "9784123456789",
				title: "Test Book",
				status: "UNEXPORTED",
				markdown: "sample markdown",
				googleDescription: null,
				googleAuthors: [],
				googleImgSrc: null,
				googleHref: null,
				rating: null,
				tags: [],
				googleSubTitle: null,
				googleTitle: null,
				imagePath: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			});

			await booksCommandRepository.create({
				id: makeId("01234567-89ab-7def-9123-456789abcdef"),
				userId: makeUserId("user123"),
				isbn: makeISBN("9784123456789"),
				title: makeBookTitle("Test Book"),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
			});

			expect(prisma.book.create).toHaveBeenCalled();
		});

		test("should create book with complete data", async () => {
			vi.mocked(prisma.book.create).mockResolvedValue({
				id: "2",
				userId: "user123",
				isbn: "9784567890123",
				title: "Complete Book",
				status: "EXPORTED",
				markdown: "# Book Review\nThis is a great book.",
				googleDescription: "Google Description",
				googleAuthors: ["Author 1", "Author 2"],
				googleImgSrc: "https://example.com/image.jpg",
				googleHref: "https://example.com/book",
				rating: 5,
				tags: ["tag1", "tag2"],
				googleSubTitle: "Google Subtitle",
				googleTitle: "Google Title",
				imagePath: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: new Date(),
			});

			const result = await booksCommandRepository.create({
				id: makeId("0198bfc4-444f-71eb-8e78-4005df127ffd"),
				userId: makeUserId("user123"),
				isbn: makeISBN("9784567890123"),
				title: makeBookTitle("Complete Book"),
				status: "UNEXPORTED",
				markdown: makeBookMarkdown("# Book Review\nThis is a great book."),
				googleDescription: makeGoogleDescription("Google Description"),
				googleAuthors: makeGoogleAuthors(["Author 1", "Author 2"]),
				googleImgSrc: makeGoogleImgSrc("https://example.com/image.jpg"),
				googleHref: makeGoogleHref("https://example.com/book"),
				googleSubTitle: makeGoogleSubTitle("Google Subtitle"),
				googleTitle: makeGoogleTitle("Google Title"),
				createdAt: makeCreatedAt(),
			});

			expect(prisma.book.create).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.book.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				booksCommandRepository.create({
					id: makeId("01234567-89ab-7def-9123-456789abcdef"),
					userId: makeUserId("user123"),
					isbn: makeISBN("9784123456789"),
					title: makeBookTitle("Test Book"),
					status: "UNEXPORTED",
					createdAt: makeCreatedAt(),
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.book.create).toHaveBeenCalled();
		});
	});

	describe("deleteById", () => {
		test("should delete book successfully", async () => {
			vi.mocked(prisma.book.delete).mockResolvedValue({
				id: "1",
				userId: "user123",
				isbn: "9784123456789",
				title: "Test Book",
				status: "EXPORTED",
				googleTitle: null,
				googleSubTitle: null,
				googleAuthors: [],
				googleDescription: null,
				googleImgSrc: null,
				googleHref: null,
				imagePath: null,
				markdown: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				rating: null,
				tags: [],
				exportedAt: null,
			});

			await booksCommandRepository.deleteById(
				makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae"),
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.book.delete).toHaveBeenCalled();
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.book.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				booksCommandRepository.deleteById(
					makeId("0198bfc4-444f-71eb-8e78-46840c337877"),
					makeUserId("user123"),
					"EXPORTED",
				),
			).rejects.toThrow("Record not found");

			expect(prisma.book.delete).toHaveBeenCalled();
		});

		test("should delete book with different status", async () => {
			vi.mocked(prisma.book.delete).mockResolvedValue({
				id: "2",
				userId: "user123",
				isbn: "9784567890123",
				title: "Another Book",
				status: "UNEXPORTED",
				googleTitle: null,
				googleSubTitle: null,
				googleAuthors: [],
				googleDescription: null,
				rating: null,
				tags: [],
				googleImgSrc: null,
				googleHref: null,
				imagePath: null,
				markdown: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			});

			await booksCommandRepository.deleteById(
				makeId("0198bfc4-444f-71eb-8e78-4eaeec50cd3e"),
				makeUserId("user123"),
				makeUnexportedStatus(),
			);

			expect(prisma.book.delete).toHaveBeenCalledWith({
				where: {
					id: "0198bfc4-444f-71eb-8e78-4eaeec50cd3e",
					userId: "user123",
					status: "UNEXPORTED",
				},
				select: { title: true },
			});
		});
	});
});
