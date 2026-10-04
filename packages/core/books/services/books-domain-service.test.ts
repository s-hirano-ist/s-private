import type { IBooksQueryRepository } from "@s-hirano-ist/s-core/books/repositories/books-query-repository.interface";
import {
	makeISBN,
	makeRating,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("BooksDomainService", () => {
	let booksQueryRepository: IBooksQueryRepository;
	let booksDomainService: BooksDomainService;

	beforeEach(() => {
		booksQueryRepository = {
			findByISBN: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			search: vi.fn(),
		} as IBooksQueryRepository;

		booksDomainService = new BooksDomainService(booksQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const isbn = makeISBN("9784123456789");
			const userId = makeUserId("test-user-id");

			vi.mocked(booksQueryRepository.findByISBN).mockResolvedValue(null);

			await expect(
				booksDomainService.ensureNoDuplicate(isbn, userId),
			).resolves.not.toThrow();

			expect(booksQueryRepository.findByISBN).toHaveBeenCalledWith(
				isbn,
				userId,
			);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const isbn = makeISBN("9784123456789");
			const userId = makeUserId("test-user-id");

			const mockBook = {
				id: "existing-book-id",
				isbn: isbn,
				userId,
				title: "Existing Book",
				status: "UNEXPORTED" as const,
				googleSubTitle: null,
				googleAuthors: [],
				googleDescription: null,
				googleImgSrc: null,
				googleHref: null,
				markdown: null,
				rating: makeRating(3),
				tags: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			};

			vi.mocked(booksQueryRepository.findByISBN).mockResolvedValue(mockBook);

			await expect(
				booksDomainService.ensureNoDuplicate(isbn, userId),
			).rejects.toThrow(DuplicateError);

			expect(booksQueryRepository.findByISBN).toHaveBeenCalledWith(
				isbn,
				userId,
			);
		});
	});
});
