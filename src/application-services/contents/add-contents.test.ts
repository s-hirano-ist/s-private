import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { parseAddContentFormData } from "@/application-services/contents/helpers/form-data-parser";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	type Content,
	contentEntity,
	makeContentTitle,
	makeMarkdown,
} from "@/domains/contents/entities/contents-entity";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { addContent } from "./add-contents";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/contents/repositories/contents-command-repository",
	() => ({ contentsCommandRepository: { create: vi.fn() } }),
);

vi.mock(
	"@/infrastructures/contents/repositories/contents-query-repository",
	() => ({ contentsQueryRepository: {} }),
);

const mockEnsureNoDuplicate = vi.fn();

vi.mock("@/domains/contents/services/contents-domain-service", () => ({
	ContentsDomainService: vi.fn().mockImplementation(() => ({
		ensureNoDuplicate: mockEnsureNoDuplicate,
	})),
}));

vi.mock(
	"@/domains/contents/entities/contents-entity",
	async (importOriginal) => {
		const actual = await importOriginal();
		return {
			...actual,
			contentEntity: {
				create: vi.fn(),
			},
		};
	},
);

vi.mock("@/application-services/contents/helpers/form-data-parser", () => ({
	parseAddContentFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("markdown", "This is an example content quote.");

describe("addContents", () => {
	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addContent(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addContent(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create contents", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const mockContent = {
			title: "Example Content",
			markdown: "sample markdown",
			userId: "user-123",
			status: "UNEXPORTED",
			id: "01234567-89ab-7def-9123-456789abcdef",
		};

		vi.mocked(parseAddContentFormData).mockReturnValue({
			title: makeContentTitle("Example Content"),
			markdown: makeMarkdown("sample markdown"),
			userId: makeUserId("user-123"),
		});
		vi.mocked(contentEntity.create).mockReturnValue(mockContent as Content);
		mockEnsureNoDuplicate.mockResolvedValue(undefined);
		vi.mocked(contentsCommandRepository.create).mockResolvedValue();

		const result = await addContent(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(vi.mocked(parseAddContentFormData)).toHaveBeenCalledWith(
			mockFormData,
			"user-123",
		);
		expect(mockEnsureNoDuplicate).toHaveBeenCalled();
		expect(vi.mocked(contentEntity.create)).toHaveBeenCalled();
		expect(contentsCommandRepository.create).toHaveBeenCalledWith(mockContent);
		expect(revalidateTag).toHaveBeenCalledWith("contents_UNEXPORTED_user-123");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		vi.mocked(parseAddContentFormData).mockReturnValue({
			title: makeContentTitle("Example Content"),
			markdown: makeMarkdown("This is an example content quote."),
			userId: makeUserId("user-123"),
		});
		mockEnsureNoDuplicate.mockRejectedValue(new DuplicateError());

		const result = await addContent(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Example Content",
			markdown: "This is an example content quote.",
		});
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		vi.mocked(parseAddContentFormData).mockReturnValue({
			title: makeContentTitle("Example Content"),
			markdown: makeMarkdown("This is an example content quote."),
			userId: makeUserId("user-123"),
		});

		const error = new Error("Domain service error");
		mockEnsureNoDuplicate.mockRejectedValue(error);

		const result = await addContent(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
