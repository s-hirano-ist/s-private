import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { deleteNews } from "@/features/news/actions/delete-news";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { loggerInfo } from "@/pino";
import { auth } from "@/utils/auth/auth";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

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

const mockAllowedRoleSession: Session = {
	user: { id: "1", roles: ["dumper"] },
	expires: "2025-01-01",
};

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

		const mockNewsItem = {
			id: 1,
			title: "Test News",
			quote: "Test Quote",
			url: "https://example.com",
			status: "UNEXPORTED" as const,
			Category: { name: "Test Category" },
			ogTitle: "sample og title 1",
			ogDescription: "sample og description 1",
		};

		vi.mocked(newsQueryRepository.findById).mockResolvedValueOnce(mockNewsItem);
		vi.mocked(newsCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteNews(1);

		expect(result).toEqual({
			success: true,
			message: "deleted",
			data: 1,
		});

		expect(newsQueryRepository.findById).toHaveBeenCalledWith(
			1,
			"1",
			"UNEXPORTED",
		);
		expect(newsCommandRepository.deleteById).toHaveBeenCalledWith(
			1,
			"1",
			"UNEXPORTED",
		);

		expect(loggerInfo).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when news not found", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		vi.mocked(newsQueryRepository.findById).mockResolvedValueOnce(null);

		const result = await deleteNews(999);

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(newsCommandRepository.deleteById).not.toHaveBeenCalled();
	});
});
