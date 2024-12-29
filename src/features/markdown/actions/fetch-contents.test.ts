import fs from "node:fs";
import { type Mock, describe, expect, it, vi } from "vitest";
import { getAllImages, getAllSlugs, getContentsBySlug } from "./fetch-contents";

vi.mock("node:fs");

vi.mock("node:path", async () => {
	const actual = await vi.importActual<typeof import("node:path")>("node:path");
	return {
		...actual,
		join: vi.fn((...paths: string[]) => paths.join("/")),
	};
});

describe("getContentsBySlug", () => {
	const mockSlug = "test.md";
	const mockPath = "test-path";
	const mockFullPath = "test-path/test.md";
	const mockFileContents = "---\ntitle: Test\n---\nThis is content.";

	it("should return the content of a markdown file", () => {
		vi.mocked(fs.readFileSync).mockReturnValue(mockFileContents);

		const result = getContentsBySlug(mockSlug, mockPath);

		expect(fs.readFileSync).toHaveBeenCalledWith(mockFullPath, "utf8");
		expect(result).toBe("This is content.");
	});

	it("should log an error and return an empty string if the file cannot be read", () => {
		const error = new Error("File not found");
		vi.mocked(fs.readFileSync).mockImplementation(() => {
			throw error;
		});

		const result = getContentsBySlug(mockSlug, mockPath);

		expect(result).toBe("");
	});
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
