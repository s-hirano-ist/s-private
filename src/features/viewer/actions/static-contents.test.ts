import { beforeEach, describe, expect, test, vi } from "vitest";
import * as staticContentsModule from "./static-contents";

vi.mock("@/features/viewer/repositories/static-contents-repository", () => ({
	staticContentsRepository: {
		findAll: vi.fn(),
		count: vi.fn(),
	},
}));

import { staticContentsRepository } from "@/features/viewer/repositories/static-contents-repository";

const { getAllStaticContents, getStaticContentsCount } = staticContentsModule;

describe("static-contents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllStaticContents", () => {
		test("should fetch and transform static contents correctly", async () => {
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

			vi.mocked(staticContentsRepository.findAll).mockResolvedValue(
				mockContents,
			);

			const result = await getAllStaticContents();

			expect(staticContentsRepository.findAll).toHaveBeenCalled();

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
			vi.mocked(staticContentsRepository.findAll).mockResolvedValue([]);

			const result = await getAllStaticContents();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticContentsRepository.findAll).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllStaticContents()).rejects.toThrow("Database error");
		});

		test("should handle contents with null images", async () => {
			const mockContents = [
				{
					title: "Test Content",
					href: "Test Content",
					image: new Uint8Array(),
				},
			];

			vi.mocked(staticContentsRepository.findAll).mockResolvedValue(
				mockContents,
			);

			const result = await getAllStaticContents();

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

			vi.mocked(staticContentsRepository.findAll).mockResolvedValue(
				mockContents,
			);

			const result = await getAllStaticContents();

			expect(result[0].href).toBe("My Special Content Title");
			expect(result[0].title).toBe("My Special Content Title");
		});
	});

	describe("getStaticContentsCount", () => {
		test("should return count of static contents", async () => {
			vi.mocked(staticContentsRepository.count).mockResolvedValue(25);

			const result = await getStaticContentsCount();

			expect(staticContentsRepository.count).toHaveBeenCalled();
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(staticContentsRepository.count).mockResolvedValue(0);

			const result = await getStaticContentsCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticContentsRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticContentsCount()).rejects.toThrow("Database error");
		});
	});
});
