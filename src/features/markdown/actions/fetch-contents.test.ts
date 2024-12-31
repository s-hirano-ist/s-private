import fs from "node:fs";
import { type Mock, describe, expect, it, vi } from "vitest";
import { getAllImages, getAllSlugs } from "./fetch-contents";

vi.mock("node:fs");

vi.mock("node:path", async () => {
	const actual = await vi.importActual<typeof import("node:path")>("node:path");
	return {
		...actual,
		join: vi.fn((...paths: string[]) => paths.join("/")),
	};
});

describe("getAllSlugs", () => {
	const mockPath = "test-path";
	const mockSlugs = ["file1.md", "file2.md", ".DS_Store"];

	it("should return all valid slugs in the directory", () => {
		(fs.readdirSync as Mock).mockReturnValue(mockSlugs);

		const result = getAllSlugs(mockPath);

		// expect(fs.readdirSync).toHaveBeenCalledWith(mockDirectory);
		expect(result).toEqual(["file1.md", "file2.md"]);
	});

	it("should log an error and return an empty array if the directory cannot be read", () => {
		const error = new Error("Directory not found");
		vi.mocked(fs.readdirSync).mockImplementation(() => {
			throw error;
		});

		const result = getAllSlugs(mockPath);

		expect(result).toEqual([]);
	});
});

describe("getAllImages", () => {
	const mockPath = "test-path";
	const mockDirectory = "s-contents/image/test-path";
	const mockImages = ["image1.png", "image2.jpg", ".DS_Store"];

	it("should return all valid images in the directory", () => {
		(fs.readdirSync as Mock).mockReturnValue(mockImages);

		const result = getAllImages(mockPath);

		// expect(fs.readdirSync).toHaveBeenCalledWith(mockDirectory);
		expect(result).toEqual(["image1.png", "image2.jpg"]);
	});

	it("should log an error and return an empty array if the directory cannot be read", () => {
		const error = new Error("Directory not found");
		vi.mocked(fs.readdirSync).mockImplementation(() => {
			throw error;
		});

		const result = getAllImages(mockPath);

		expect(result).toEqual([]);
	});
});
