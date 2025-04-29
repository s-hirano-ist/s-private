import { deleteNews } from "@/features/news/actions/delete-news";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/features/auth/utils/session", () => ({
	getSelfId: vi.fn().mockResolvedValue(1),
	hasDumperPostPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/prisma", () => ({
	default: {
		news: {
			findUnique: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock("@/pino", () => ({
	loggerInfo: vi.fn(),
	loggerError: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("deleteNews", () => {
	test("should delete news successfully", async () => {
		const mockNewsItem = {
			id: 1,
			title: "Test News",
			quote: "Test Quote",
			url: "https://example.com",
			categoryId: 1,
			userId: 1,
			status: "UNEXPORTED",
		};

		vi.mocked(prisma.news.findUnique).mockResolvedValueOnce(mockNewsItem);
		vi.mocked(prisma.news.delete).mockResolvedValueOnce({
			id: 1,
			title: "Test News",
			quote: "Test Quote",
			url: "https://example.com",
			categoryId: 1,
			userId: "1",
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result = await deleteNews(1);

		expect(result).toEqual({
			success: true,
			message: "deleted",
			data: 1,
		});

		expect(prisma.news.findUnique).toHaveBeenCalledWith({
			where: { id: 1, userId: 1 },
		});

		expect(prisma.news.delete).toHaveBeenCalledWith({
			where: { id: 1, userId: 1 },
		});

		expect(loggerInfo).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when news not found", async () => {
		vi.mocked(prisma.news.findUnique).mockResolvedValueOnce(null);

		const result = await deleteNews(999);

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(prisma.news.delete).not.toHaveBeenCalled();
	});
});
