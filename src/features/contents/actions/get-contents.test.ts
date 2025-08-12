import { beforeEach, describe, expect, test, vi } from "vitest";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";
import { getAllContents, getContentsCount } from "./get-contents";

vi.mock("@/features/contents/repositories/contents-repository", () => ({
	contentsRepository: {
		findAll: vi.fn(),
		count: vi.fn(),
	},
}));

describe("get-contents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllContents", () => {
		test("should fetch and transform contents correctly", async () => {
			const mockContents = [
				{
					title: "Test Content 1",
					href: "Test Content 1",
					image: new Uint8Array([1, 2, 3]),
				},
				{
					title: "Test Content 2",
					href: "Test Content 2",
					image: new Uint8Array([4, 5, 6]),
				},
			];

			vi.mocked(contentsRepository.findAll).mockResolvedValue(mockContents);

			const result = await getAllContents();

			expect(contentsRepository.findAll).toHaveBeenCalled();

			expect(result).toEqual([
				{
					title: "Test Content 1",
					href: "Test Content 1",
					image: new Uint8Array([1, 2, 3]),
				},
				{
					title: "Test Content 2",
					href: "Test Content 2",
					image: new Uint8Array([4, 5, 6]),
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(contentsRepository.findAll).mockResolvedValue([]);

			const result = await getAllContents();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsRepository.findAll).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllContents()).rejects.toThrow("Database error");
		});

		test("should handle contents with null images", async () => {
			const mockContents = [
				{
					title: "Test Content",
					href: "Test Content",
					image: new Uint8Array(),
				},
			];

			vi.mocked(contentsRepository.findAll).mockResolvedValue(mockContents);

			const result = await getAllContents();

			expect(result).toEqual([
				{
					title: "Test Content",
					href: "Test Content",
					image: new Uint8Array(), // Repository returns empty Uint8Array for null
				},
			]);
		});

		test("should use title as href for contents", async () => {
			const mockContents = [
				{
					title: "My Special Content Title",
					href: "My Special Content Title",
					image: new Uint8Array([1, 2, 3]),
				},
			];

			vi.mocked(contentsRepository.findAll).mockResolvedValue(mockContents);

			const result = await getAllContents();

			expect(result[0].href).toBe("My Special Content Title");
			expect(result[0].title).toBe("My Special Content Title");
		});
	});

	describe("getContentsCount", () => {
		test("should return count of contents", async () => {
			vi.mocked(contentsRepository.count).mockResolvedValue(25);

			const result = await getContentsCount();

			expect(contentsRepository.count).toHaveBeenCalled();
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(contentsRepository.count).mockResolvedValue(0);

			const result = await getContentsCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getContentsCount()).rejects.toThrow("Database error");
		});
	});
});
