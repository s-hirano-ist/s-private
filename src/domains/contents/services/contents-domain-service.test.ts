import { beforeEach, describe, expect, test, vi } from "vitest";
import { InvalidFormatError } from "@/common/error/error-classes";
import type { IContentsQueryRepository } from "../types";
import { ContentsDomainService } from "./contents-domain-service";

// Mock at the module level before any imports
vi.mock("uuid", () => ({
	v7: () => "01234567-89ab-cdef-0123-456789abcdef",
}));

describe("ContentsDomainService", () => {
	let contentsQueryRepository: IContentsQueryRepository;
	let service: ContentsDomainService;

	beforeEach(() => {
		contentsQueryRepository = {
			findByTitle: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		};
		service = new ContentsDomainService(contentsQueryRepository);
	});

	describe("prepareNewContents", () => {
		test("should prepare valid contents data", async () => {
			const formData = new FormData();
			formData.append("title", "Test Content");
			formData.append("markdown", "# Test markdown");

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(null);

			const result = await service.prepareNewContents(formData, "user-123");

			expect(result.title).toBe("Test Content");
			expect(result.markdown).toBe("# Test markdown");
			expect(result.userId).toBe("user-123");
			expect(result.status).toBe("UNEXPORTED");
			expect(result.id).toBe("01234567-89ab-7def-8123-456789abcdef");
			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Test Content",
				"user-123",
			);
		});

		test("should throw InvalidFormatError for empty title", async () => {
			const formData = new FormData();
			formData.append("title", "");
			formData.append("markdown", "# Test markdown");

			await expect(
				service.prepareNewContents(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(contentsQueryRepository.findByTitle).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for empty markdown", async () => {
			const formData = new FormData();
			formData.append("title", "Test Content");
			formData.append("markdown", "");

			await expect(
				service.prepareNewContents(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(contentsQueryRepository.findByTitle).not.toHaveBeenCalled();
		});

		test("should throw InvalidFormatError for title too long", async () => {
			const formData = new FormData();
			formData.append("title", "a".repeat(65));
			formData.append("markdown", "# Test markdown");

			await expect(
				service.prepareNewContents(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);

			expect(contentsQueryRepository.findByTitle).not.toHaveBeenCalled();
		});

		test("should throw DuplicateError when title already exists", async () => {
			const { DuplicateError } = await import("@/common/error/error-classes");

			const formData = new FormData();
			formData.append("title", "Test Content");
			formData.append("markdown", "# Test markdown");

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(
				"existing-id",
			);

			await expect(
				service.prepareNewContents(formData, "user-123"),
			).rejects.toThrow(DuplicateError);

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Test Content",
				"user-123",
			);
		});

		test("should handle missing form fields gracefully", async () => {
			const formData = new FormData();
			// No fields added

			await expect(
				service.prepareNewContents(formData, "user-123"),
			).rejects.toThrow(InvalidFormatError);
		});

		test("should handle null form values", async () => {
			const formData = new FormData();
			formData.append("title", "null");
			formData.append("markdown", "null");

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(null);

			const result = await service.prepareNewContents(formData, "user-123");

			expect(result.title).toBe("null");
			expect(result.markdown).toBe("null");
		});
	});
});
