import { SUCCESS_MESSAGES } from "@/constants";
import { getSelfId, hasDumperPostPermission } from "@/features/auth/utils/role";
import { validateCategory } from "@/features/news/utils/validate-category";
import { validateNews } from "@/features/news/utils/validate-news";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateNewsMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { addNews } from "./add-news";

vi.mock("@/features/auth/utils/role", () => ({
	getSelfId: vi.fn(),
}));

vi.mock("@/features/news/utils/validate-category", () => ({
	validateCategory: vi.fn(),
}));

vi.mock("@/features/news/utils/validate-news", () => ({
	validateNews: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/utils/format-for-line", () => ({
	formatCreateNewsMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

describe.skip("addNews", () => {
	it("should create a category and news item if a new category is provided", async () => {
		const formData = new FormData();
		formData.append("category", "Tech");
		formData.append("title", "New Technology");
		formData.append("quote", "Technology is evolving fast.");
		formData.append("url", "https://example.com/tech");

		const mockUserId = "12345";
		const mockCategory = { id: 1, name: "Tech" };
		const mockNews = {
			id: 1,
			title: "New Technology",
			quote: "Technology is evolving fast.",
			url: "https://example.com/tech",
			Category: { name: "Tech" },
		};
		const mockValidatedCategory = { name: "Tech" };
		const mockValidatedNews = {
			title: "New Technology",
			quote: "Technology is evolving fast.",
			url: "https://example.com/tech",
		};

		(hasDumperPostPermission as Mock).mockResolvedValue(undefined);
		(getSelfId as Mock).mockResolvedValue(mockUserId);
		(validateCategory as Mock).mockReturnValue(mockValidatedCategory);
		(prisma.categories.upsert as Mock).mockResolvedValue(mockCategory);
		(validateNews as Mock).mockReturnValue(mockValidatedNews);
		(prisma.news.create as Mock).mockResolvedValue(mockNews);
		(formatCreateNewsMessage as Mock).mockReturnValue("News created message");

		const result = await addNews(formData);

		expect(hasDumperPostPermission).toHaveBeenCalledTimes(1);
		expect(getSelfId).toHaveBeenCalledTimes(1);
		expect(validateCategory).toHaveBeenCalledWith(formData);
		expect(prisma.categories.upsert).toHaveBeenCalledWith({
			update: {},
			where: { name_userId: { name: "Tech", userId: "12345" } },
			create: { userId: mockUserId, ...mockValidatedCategory },
		});
		expect(validateNews).toHaveBeenCalledWith(formData);
		expect(prisma.news.create).toHaveBeenCalledWith({
			data: { userId: mockUserId, ...mockValidatedNews },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
				Category: true,
			},
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledTimes(1); // News notifications
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: {
				...mockNews,
				category: mockNews.Category.name,
			},
		});
	});

	it("should create only news if no new category is provided", async () => {
		const formData = new FormData();
		formData.append("title", "New Technology");
		formData.append("quote", "Technology is evolving fast.");
		formData.append("url", "https://example.com/tech");

		const mockUserId = "12345";
		const mockNews = {
			id: 1,
			title: "New Technology",
			quote: "Technology is evolving fast.",
			url: "https://example.com/tech",
			Category: { name: "Tech" },
		};
		const mockValidatedNews = {
			title: "New Technology",
			quote: "Technology is evolving fast.",
			url: "https://example.com/tech",
		};

		(hasDumperPostPermission as Mock).mockResolvedValue(undefined);
		(getSelfId as Mock).mockResolvedValue(mockUserId);
		(validateNews as Mock).mockReturnValue(mockValidatedNews);
		(prisma.news.create as Mock).mockResolvedValue(mockNews);
		(formatCreateNewsMessage as Mock).mockReturnValue("News created message");

		const result = await addNews(formData);

		expect(hasDumperPostPermission).toHaveBeenCalledTimes(1);
		expect(getSelfId).toHaveBeenCalledTimes(1);
		expect(validateNews).toHaveBeenCalledWith(formData);
		expect(prisma.news.create).toHaveBeenCalledWith({
			data: { userId: mockUserId, ...mockValidatedNews },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
				Category: true,
			},
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledTimes(1); // Only news notification
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: {
				...mockNews,
				category: mockNews.Category.name,
			},
		});
	});
});
