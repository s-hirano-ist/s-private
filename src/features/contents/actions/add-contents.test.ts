import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { addContents } from "./add-contents";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock(
	"@/infrastructures/contents/repositories/contents-command-repository",
	() => ({
		contentsCommandRepository: {
			create: vi.fn(),
		},
	}),
);

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

vi.mock("@/domains/contents/services/contents-domain-service", () => ({
	ContentsDomainService: vi.fn().mockImplementation(() => ({
		prepareNewContents: vi.fn().mockResolvedValue({
			title: "Example Content",
			markdown: "This is an example content quote.",
			userId: "1",
			status: "UNEXPORTED",
		}),
	})),
}));

vi.mock(
	"@/infrastructures/contents/repositories/contents-query-repository",
	() => ({
		contentsQueryRepository: {},
	}),
);

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("markdown", "This is an example content quote.");

describe("addContents", () => {
	test("should return success false on Unauthorized", async () => {
		mockGetSelfId.mockRejectedValue(new Error("UNAUTHORIZED"));
		mockHasDumperPostPermission.mockResolvedValue(true);

		const result = await addContents(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return success false on not permitted", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		await expect(addContents(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create contents", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");
		vi.mocked(contentsCommandRepository.create).mockResolvedValue();

		const result = await addContents(mockFormData);

		expect(mockHasDumperPostPermission).toHaveBeenCalled();
		expect(mockGetSelfId).toHaveBeenCalled();
		expect(contentsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "inserted",
		});
	});
});
