import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import {
	getAllStaticContents,
	getStaticContentsCount,
} from "./static-contents";

vi.mock("@/prisma", () => ({
	default: {
		staticContents: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

describe("static-contents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllStaticContents", () => {
		test("should fetch and transform static contents correctly", async () => {
			const mockContents = [
				{
					title: "Test Content 1",
					uint8ArrayImage: new Uint8Array([1, 2, 3]),
				},
				{
					title: "Test Content 2",
					uint8ArrayImage: new Uint8Array([4, 5, 6]),
				},
			];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);

			const result = await getAllStaticContents();

			expect(prisma.staticContents.findMany).toHaveBeenCalledWith({
				select: { title: true, uint8ArrayImage: true },
				cacheStrategy: { ttl: 400, tags: ["staticContents"] },
			});

			expect(result).toEqual([
				{
					title: "Test Content 1",
					href: "Test Content 1",
					uint8ArrayImage: new Uint8Array([1, 2, 3]),
				},
				{
					title: "Test Content 2",
					href: "Test Content 2",
					uint8ArrayImage: new Uint8Array([4, 5, 6]),
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.staticContents.findMany).mockResolvedValue([]);

			const result = await getAllStaticContents();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.staticContents.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllStaticContents()).rejects.toThrow("Database error");
		});

		test("should handle contents with null images", async () => {
			const mockContents = [
				{
					title: "Test Content",
					uint8ArrayImage: null,
				},
			];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);

			const result = await getAllStaticContents();

			expect(result).toEqual([
				{
					title: "Test Content",
					href: "Test Content",
					uint8ArrayImage: null,
				},
			]);
		});

		test("should use title as href for contents", async () => {
			const mockContents = [
				{
					title: "My Special Content Title",
					uint8ArrayImage: new Uint8Array([1, 2, 3]),
				},
			];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);

			const result = await getAllStaticContents();

			expect(result[0].href).toBe("My Special Content Title");
			expect(result[0].title).toBe("My Special Content Title");
		});
	});

	describe("getStaticContentsCount", () => {
		test("should return count of static contents", async () => {
			vi.mocked(prisma.staticContents.count).mockResolvedValue(25);

			const result = await getStaticContentsCount();

			expect(prisma.staticContents.count).toHaveBeenCalledWith({});
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.staticContents.count).mockResolvedValue(0);

			const result = await getStaticContentsCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.staticContents.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticContentsCount()).rejects.toThrow("Database error");
		});
	});
});
