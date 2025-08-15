import { beforeEach, describe, expect, test, vi } from "vitest";
import { InvalidFormatError } from "@/common/error/error-classes";
import type { INewsQueryRepository } from "../types";
import { NewsDomainService } from "./news-domain-service";

describe("NewsDomainService", () => {
	let newsQueryRepository: INewsQueryRepository;
	let service: NewsDomainService;

	beforeEach(() => {
		newsQueryRepository = {
			findByUrl: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		};
		service = new NewsDomainService(newsQueryRepository);
	});

	describe("prepareNewNews", () => {
		test("should prepare valid news data", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("quote", "Test quote");
			formData.append("url", "https://example.com");
			formData.append("category", "tech");

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue(null);

			const result = await service.prepareNewNews(formData, "user-123");

			expect(result.title).toBe("Test News");
			expect(result.quote).toBe("Test quote");
			expect(result.url).toBe("https://example.com");
			expect(result.category.name).toBe("tech");
			expect(result.userId).toBe("user-123");
			expect(result.status).toBe("UNEXPORTED");
			expect(result.id).toBe("01234567-89ab-7def-8123-456789abcdef");
			expect(result.category.id).toBe("01234567-89ab-7def-8123-456789abcdef");
			expect(newsQueryRepository.findByUrl).toHaveBeenCalledWith(
				"https://example.com",
				"user-123",
			);
		});

		test("should prepare news data with null quote", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "tech");
			// quote not added (null)

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue(null);

			const result = await service.prepareNewNews(formData, "user-123");

			expect(result.quote).toBeNull();
		});

		test("should throw InvalidFormatError for empty title", async () => {
			const formData = new FormData();
			formData.append("title", "");
			formData.append("url", "https://example.com");
			formData.append("category", "tech");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for invalid URL", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "not-a-url");
			formData.append("category", "tech");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for non-http(s) URL", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "ftp://example.com");
			formData.append("category", "tech");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for empty category", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for category too long", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "a".repeat(17));

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for title too long", async () => {
			const formData = new FormData();
			formData.append("title", "a".repeat(65));
			formData.append("url", "https://example.com");
			formData.append("category", "tech");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for quote too long", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "tech");
			formData.append("quote", "a".repeat(257));

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(newsQueryRepository.findByUrl).not.toHaveBeenCalled();
		});

		test("should throw DuplicateError when URL already exists", async () => {
			const { DuplicateError } = await import("@/common/error/error-classes");

			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "tech");

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue("existing-id");

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(DuplicateError);

			expect(newsQueryRepository.findByUrl).toHaveBeenCalledWith(
				"https://example.com",
				"user-123",
			);
		});

		test("should handle missing form fields gracefully", async () => {
			const formData = new FormData();
			// No fields added

			await expect(
				service.prepareNewNews(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);
		});

		test("should trim category name", async () => {
			const formData = new FormData();
			formData.append("title", "Test News");
			formData.append("url", "https://example.com");
			formData.append("category", "  tech  ");

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue(null);

			const result = await service.prepareNewNews(formData, "user-123");

			expect(result.category.name).toBe("tech");
		});
	});
});
