import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { deleteNews } from "@/features/news/actions/delete-news";
import { newsRepository } from "@/features/news/repositories/news-repository";
import { loggerInfo } from "@/pino";
import { auth } from "@/utils/auth/auth";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/features/news/repositories/news-repository", () => ({
	newsRepository: {
		findByIdAndUserId: vi.fn(),
		deleteByIdAndUserId: vi.fn(),
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
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
			categoryId: 1,
			userId: "1",
			status: "UNEXPORTED" as const,
			createdAt: new Date(),
			updatedAt: new Date(),
			Category: {
				id: 1,
				name: "Test Category",
			},
			ogTitle: "sample og title 1",
			ogDescription: "sample og description 1",
			ogImageUrl: "https://example.com/1",
		};

		vi.mocked(newsRepository.findByIdAndUserId).mockResolvedValueOnce(
			mockNewsItem,
		);
		vi.mocked(newsRepository.deleteByIdAndUserId).mockResolvedValueOnce();

		const result = await deleteNews(1);

		expect(result).toEqual({
			success: true,
			message: "deleted",
			data: 1,
		});

		expect(newsRepository.findByIdAndUserId).toHaveBeenCalledWith(1, "1");
		expect(newsRepository.deleteByIdAndUserId).toHaveBeenCalledWith(1, "1");

		expect(loggerInfo).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when news not found", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		vi.mocked(newsRepository.findByIdAndUserId).mockResolvedValueOnce(null);

		const result = await deleteNews(999);

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(newsRepository.deleteByIdAndUserId).not.toHaveBeenCalled();
	});
});
