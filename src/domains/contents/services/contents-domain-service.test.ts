import { describe, expect, test } from "vitest";
import { validateContents } from "@/domains/contents/services/contents-domain-service";
import type { IContentsQueryRepository } from "@/domains/contents/types";
import { InvalidFormatError } from "@/utils/error/error-classes";

const mockContentsQueryRepository: IContentsQueryRepository = {
	findByTitle: async () => null,
	findMany: async () => [],
	count: async () => 0,
};

describe.skip("validateContents", () => {
	test("should validate correct contents data", async () => {
		const formData = new FormData();
		formData.append("title", "Sample Content");
		formData.append("markdown", "# This is markdown content");

		const result = await validateContents(
			formData,
			"user-123",
			mockContentsQueryRepository,
		);

		expect(result.title).toBe("Sample Content");
		expect(result.markdown).toBe("# This is markdown content");
	});

	test("should throw InvalidFormatError when title is missing", async () => {
		const formData = new FormData();
		formData.append("markdown", "# This is markdown content");

		await expect(() =>
			validateContents(formData, "user-123", mockContentsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is empty", async () => {
		const formData = new FormData();
		formData.append("title", "");
		formData.append("markdown", "# This is markdown content");

		await expect(() =>
			validateContents(formData, "user-123", mockContentsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when markdown is missing", async () => {
		const formData = new FormData();
		formData.append("title", "Sample Content");

		await expect(() =>
			validateContents(formData, "user-123", mockContentsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when markdown is empty", async () => {
		const formData = new FormData();
		formData.append("title", "Sample Content");
		formData.append("markdown", "");

		await expect(() =>
			validateContents(formData, "user-123", mockContentsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title exceeds max length", async () => {
		const formData = new FormData();
		formData.append("title", "a".repeat(65));
		formData.append("markdown", "# This is markdown content");

		await expect(() =>
			validateContents(formData, "user-123", mockContentsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});
});
