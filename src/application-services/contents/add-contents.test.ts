import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { addContents } from "./add-contents";

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

const mockPrepareNewContents = vi.fn();

vi.mock("@/domains/contents/services/contents-domain-service", () => ({
	ContentsDomainService: vi.fn().mockImplementation(() => ({
		prepareNewContents: mockPrepareNewContents,
	})),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("markdown", "This is an example content quote.");

describe("addContents", () => {
	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addContents(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addContents(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create contents", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		mockPrepareNewContents.mockResolvedValue({
			title: "Example Content",
			markdown: "sample markdown",
			userId: "user-123",
			status: "UNEXPORTED",
			id: "01234567-89ab-cdef-0123-456789abcdef",
		});
		vi.mocked(contentsCommandRepository.create).mockResolvedValue();

		const result = await addContents(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(mockPrepareNewContents).toHaveBeenCalledWith(
			mockFormData,
			"user-123",
		);
		expect(contentsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");
		mockPrepareNewContents.mockRejectedValue(new DuplicateError());

		const result = await addContents(mockFormData);

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

		const error = new Error("Domain service error");
		mockPrepareNewContents.mockRejectedValue(error);

		const result = await addContents(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
