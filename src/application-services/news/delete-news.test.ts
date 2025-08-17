import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteNews } from "@/application-services/news/delete-news";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";

vi.mock("@/infrastructures/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		deleteById: vi.fn(),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(newsCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteNews("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
		expect(revalidateTag).toHaveBeenCalledWith("news_UNEXPORTED_1");
	});

	test("should return error when news not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(newsCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteNews("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			"999",
			"1",
			"UNEXPORTED",
		);
	});
});
