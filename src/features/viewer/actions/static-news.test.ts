import { beforeEach, describe, expect, test, vi } from "vitest";
import { PAGE_SIZE } from "@/constants";
import db from "@/db";
import { staticNews } from "@/db/schema";
import { getStaticNews, getStaticNewsCount } from "./static-news";

vi.mock("@/db", () => ({
	default: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn(),
	},
}));

vi.mock("@/constants", () => ({
	PAGE_SIZE: 10,
}));

describe("static-news", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getStaticNews", () => {
		test("should fetch static news with correct pagination for first page", async () => {
			const mockNews = [
				{
					id: 1,
					title: "Test News 1",
					url: "https://example.com/news1",
					quote: "This is a test quote 1",
				},
				{
					id: 2,
					title: "Test News 2",
					url: "https://example.com/news2",
					quote: "This is a test quote 2",
				},
			];

			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(mockNews),
					}),
				}),
			});

			const result = await getStaticNews(1);

			expect(db.select).toHaveBeenCalledWith({
				id: staticNews.id,
				title: staticNews.title,
				url: staticNews.url,
				quote: staticNews.quote,
				ogImageUrl: staticNews.ogImageUrl,
				ogTitle: staticNews.ogTitle,
				ogDescription: staticNews.ogDescription,
			});
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(db.select().from().limit).toHaveBeenCalledWith(PAGE_SIZE);
			expect(db.select().from().limit().offset).toHaveBeenCalledWith(0);

			expect(result).toEqual(mockNews);
		});

		test("should fetch static news with correct pagination for second page", async () => {
			const mockNews = [
				{
					id: 11,
					title: "Test News 11",
					url: "https://example.com/news11",
					quote: "This is a test quote 11",
				},
			];

			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(mockNews),
					}),
				}),
			});

			const result = await getStaticNews(2);

			expect(db.select).toHaveBeenCalledWith({
				id: staticNews.id,
				title: staticNews.title,
				url: staticNews.url,
				quote: staticNews.quote,
				ogImageUrl: staticNews.ogImageUrl,
				ogTitle: staticNews.ogTitle,
				ogDescription: staticNews.ogDescription,
			});
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(db.select().from().limit).toHaveBeenCalledWith(PAGE_SIZE);
			expect(db.select().from().limit().offset).toHaveBeenCalledWith(10);

			expect(result).toEqual(mockNews);
		});

		test("should fetch static news with correct pagination for third page", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mockNews: any[] = [];

			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(mockNews),
					}),
				}),
			});

			const result = await getStaticNews(3);

			expect(db.select).toHaveBeenCalledWith({
				id: staticNews.id,
				title: staticNews.title,
				url: staticNews.url,
				quote: staticNews.quote,
				ogImageUrl: staticNews.ogImageUrl,
				ogTitle: staticNews.ogTitle,
				ogDescription: staticNews.ogDescription,
			});
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(db.select().from().limit).toHaveBeenCalledWith(PAGE_SIZE);
			expect(db.select().from().limit().offset).toHaveBeenCalledWith(20);

			expect(result).toEqual([]);
		});

		test("should handle empty results", async () => {
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			const result = await getStaticNews(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			await expect(getStaticNews(1)).rejects.toThrow("Database error");
		});

		test("should handle page 0 correctly", async () => {
			const mockNews = [
				{
					id: 1,
					title: "Test News 1",
					url: "https://example.com/news1",
					quote: "This is a test quote 1",
				},
			];

			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(mockNews),
					}),
				}),
			});

			const result = await getStaticNews(0);

			expect(db.select).toHaveBeenCalledWith({
				id: staticNews.id,
				title: staticNews.title,
				url: staticNews.url,
				quote: staticNews.quote,
				ogImageUrl: staticNews.ogImageUrl,
				ogTitle: staticNews.ogTitle,
				ogDescription: staticNews.ogDescription,
			});
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(db.select().from().limit).toHaveBeenCalledWith(PAGE_SIZE);
			expect(db.select().from().limit().offset).toHaveBeenCalledWith(-10);

			expect(result).toEqual(mockNews);
		});

		test("should handle large page numbers", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mockNews: any[] = [];

			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(mockNews),
					}),
				}),
			});

			const result = await getStaticNews(100);

			expect(db.select).toHaveBeenCalledWith({
				id: staticNews.id,
				title: staticNews.title,
				url: staticNews.url,
				quote: staticNews.quote,
				ogImageUrl: staticNews.ogImageUrl,
				ogTitle: staticNews.ogTitle,
				ogDescription: staticNews.ogDescription,
			});
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(db.select().from().limit).toHaveBeenCalledWith(PAGE_SIZE);
			expect(db.select().from().limit().offset).toHaveBeenCalledWith(990);

			expect(result).toEqual([]);
		});
	});

	describe("getStaticNewsCount", () => {
		test("should return count of static news", async () => {
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockResolvedValue([{ count: 100 }]),
			});

			const result = await getStaticNewsCount();

			expect(db.select).toHaveBeenCalled();
			expect(db.select().from).toHaveBeenCalledWith(staticNews);
			expect(result).toBe(100);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockResolvedValue([{ count: 0 }]),
			});

			const result = await getStaticNewsCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(db.select).mockReturnValue({
				from: vi.fn().mockRejectedValue(new Error("Database error")),
			});

			await expect(getStaticNewsCount()).rejects.toThrow("Database error");
		});
	});
});