import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteNews } from "@/features/news/actions/delete-news";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { serverLogger } from "@/o11y/server";

vi.mock("@/features/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {
		findById: vi.fn(),
	},
}));

vi.mock("@/features/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		deleteById: vi.fn(),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/utils/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		const mockNewsItem = {
			id: "1",
			title: "Test News",
			quote: "Test Quote",
			url: "https://example.com",
			status: "UNEXPORTED" as const,
			Category: { id: 1, name: "Test Category" },
			ogTitle: "sample og title 1",
			ogDescription: "sample og description 1",
		};

		vi.mocked(newsQueryRepository.findById).mockResolvedValueOnce(mockNewsItem);
		vi.mocked(newsCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteNews("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
			data: "1",
		});

		expect(newsQueryRepository.findById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);

		expect(serverLogger.info).toHaveBeenCalledWith(
			"Deleted news: Test News",
			{
				caller: "deleteNews",
				status: 200,
				userId: "1",
			},
			{ notify: true },
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when news not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");
		vi.mocked(newsQueryRepository.findById).mockResolvedValueOnce(null);

		const result = await deleteNews("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(newsCommandRepository.deleteById).not.toHaveBeenCalled();
	});
});
