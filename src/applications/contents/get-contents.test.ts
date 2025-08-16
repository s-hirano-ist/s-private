import { beforeEach, describe, expect, test, vi } from "vitest";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";
import { getContentsCount, getExportedContents } from "./get-contents";

vi.mock(
	"@/infrastructures/contents/repositories/contents-query-repository",
	() => ({
		contentsQueryRepository: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
	}),
);

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-contents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllContents", () => {
		test("should fetch and transform contents correctly", async () => {
			const mockContents = [
				{
					id: "1",
					key: "1",
					title: "Test Content 1",
				},
				{
					id: "2",
					key: "2",
					title: "Test Content 2",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);

			const result = await getExportedContents();

			expect(contentsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				expect.objectContaining({
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["contents"] },
				}),
			);

			expect(result).toEqual([
				{
					id: "1",
					key: "1",
					title: "Test Content 1",
					description: "",
					href: "/content/Test%20Content%201",
				},
				{
					id: "2",
					key: "2",
					title: "Test Content 2",
					description: "",
					href: "/content/Test%20Content%202",
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue([]);

			const result = await getExportedContents();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedContents()).rejects.toThrow("Database error");
		});

		test("should handle contents with null images", async () => {
			const mockContents = [
				{
					id: "",
					key: "1",
					title: "Test Content",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);

			const result = await getExportedContents();

			expect(result).toEqual([
				{
					id: "",
					key: "",
					title: "Test Content",
					description: "",
					href: "/content/Test%20Content",
				},
			]);
		});

		test("should use title as href for contents", async () => {
			const mockContents = [
				{
					id: "",
					key: "1",
					title: "My Special Content Title",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);

			const result = await getExportedContents();

			expect(result[0].href).toBe("/content/My%20Special%20Content%20Title");
			expect(result[0].title).toBe("My Special Content Title");
		});
	});

	describe("getContentsCount", () => {
		test("should return count of contents", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(25);

			const result = await getContentsCount("EXPORTED");

			expect(contentsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(0);

			const result = await getContentsCount("EXPORTED");

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getContentsCount("EXPORTED")).rejects.toThrow(
				"Database error",
			);
		});
	});
});
