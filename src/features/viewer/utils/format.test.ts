import { describe, expect, it } from "vitest";
import { formatSlugsAndImages } from "./format";

describe("formatSlugsAndImages", () => {
	it("should correctly map slugs to images", () => {
		const slugs = ["slug1", "slug2", "slug3"];
		const images = ["image1.png", "image2.png", "image3.png"];

		const result = formatSlugsAndImages(slugs, images);

		expect(result).toEqual({
			slug1: "image1.png",
			slug2: "image2.png",
			slug3: "image3.png",
		});
	});

	it("should handle cases where slugs and images are empty arrays", () => {
		const slugs: string[] = [];
		const images: string[] = [];

		const result = formatSlugsAndImages(slugs, images);

		expect(result).toEqual({});
	});

	it("should handle cases where slugs and images have mismatched lengths", () => {
		const slugs = ["slug1", "slug2"];
		const images = ["image1.png"];

		const result = formatSlugsAndImages(slugs, images);

		expect(result).toEqual({
			slug1: "image1.png",
			slug2: undefined, // images に該当する値がない場合
		});
	});
});
