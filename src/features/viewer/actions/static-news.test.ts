import { beforeEach, describe, expect, test, vi } from "vitest";
import * as staticNewsModule from "./static-news";

vi.mock("@/features/viewer/repositories/static-news-repository", () => ({
	staticNewsRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
}));

import { staticNewsRepository } from "@/features/viewer/repositories/static-news-repository";

const { getStaticNews, getStaticNewsCount } = staticNewsModule;

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

			vi.mocked(staticNewsRepository.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(1);

			expect(staticNewsRepository.findMany).toHaveBeenCalledWith(1);

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

			vi.mocked(staticNewsRepository.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(2);

			expect(staticNewsRepository.findMany).toHaveBeenCalledWith(2);

			expect(result).toEqual(mockNews);
		});

		test("should fetch static news with correct pagination for third page", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mockNews: any[] = [];

			vi.mocked(staticNewsRepository.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(3);

			expect(staticNewsRepository.findMany).toHaveBeenCalledWith(3);

			expect(result).toEqual([]);
		});

		test("should handle empty results", async () => {
			vi.mocked(staticNewsRepository.findMany).mockResolvedValue([]);

			const result = await getStaticNews(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticNewsRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

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

			vi.mocked(staticNewsRepository.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(0);

			expect(staticNewsRepository.findMany).toHaveBeenCalledWith(0);

			expect(result).toEqual(mockNews);
		});

		test("should handle large page numbers", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mockNews: any[] = [];

			vi.mocked(staticNewsRepository.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(100);

			expect(staticNewsRepository.findMany).toHaveBeenCalledWith(100);

			expect(result).toEqual([]);
		});
	});

	describe("getStaticNewsCount", () => {
		test("should return count of static news", async () => {
			vi.mocked(staticNewsRepository.count).mockResolvedValue(100);

			const result = await getStaticNewsCount();

			expect(staticNewsRepository.count).toHaveBeenCalled();
			expect(result).toBe(100);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(staticNewsRepository.count).mockResolvedValue(0);

			const result = await getStaticNewsCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticNewsRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticNewsCount()).rejects.toThrow("Database error");
		});
	});
});
