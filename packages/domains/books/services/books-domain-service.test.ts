import { beforeEach, describe, expect, test, vi } from "vitest";
import type { IBooksQueryRepository } from "../../books/repositories/books-query-repository.interface";
import { makeUserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import { makeISBN } from "../entities/books-entity";
import { BooksDomainService } from "../services/books-domain-service";

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
				ISBN: isbn,
				userId,
				title: "Existing Book",
				status: "UNEXPORTED" as const,
				googleTitle: null,
				googleSubTitle: null,
				googleAuthors: [],
				googleDescription: null,
				googleImgSrc: null,
				googleHref: null,
				markdown: null,
				rating: null,
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
