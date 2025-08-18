import { beforeEach, describe, expect, test, vi } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { makeISBN } from "@/domains/books/entities/books-entity";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import type { IBooksQueryRepository } from "@/domains/books/types";
import { makeUserId } from "@/domains/common/entities/common-entity";

describe("BooksDomainService", () => {
	let booksQueryRepository: IBooksQueryRepository;
	let booksDomainService: BooksDomainService;

	beforeEach(() => {
		booksQueryRepository = {
			findByISBN: vi.fn(),
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
