import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { describe, expect, test } from "vitest";
import { parseSupportedImageFile } from "./image-upload-parser";

const JPEG_BYTES = Buffer.from(
	"/9j/4AAQSkZJRgABAgAAAQABAAD/wAARCAABAAEDAREAAhEBAxEB/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD50r8KP9Uz/9k=",
	"base64",
);
const PNG_BYTES = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4AQEFAPr/AP8AAP8FAAH/+lyI0QAAAABJRU5ErkJggg==",
	"base64",
);
const WEBP_BYTES = Buffer.from(
	"UklGRhoAAABXRUJQVlA4TA4AAAAvAAAAEM1VICIC0f+IBA==",
	"base64",
);

function buildFile(bytes: Uint8Array, name: string, type = ""): File {
	return new File([bytes], name, { type });
}

function isWebp(bytes: Uint8Array): boolean {
	return (
		bytes.length >= 12 &&
		Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
		Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
	);
}

describe("parseSupportedImageFile", () => {
	test.each([
		["JPEG", JPEG_BYTES, "generated.jpg", "image/jpeg"],
		["PNG", PNG_BYTES, "generated.png", "image/png"],
		["WebP", WEBP_BYTES, "generated.webp", "image/webp"],
	])(
		"should parse a %s file and create a WebP thumbnail",
		async (_label, bytes, fileName, expectedContentType) => {
			const file = buildFile(bytes, fileName);

			const result = await parseSupportedImageFile(file);

			expect(result.contentType).toBe(expectedContentType);
			expect(Buffer.from(result.originalBuffer)).toEqual(bytes);
			expect(isWebp(result.thumbnailBuffer)).toBe(true);
		},
	);

	test.each([
		["GIF", Buffer.from("GIF89a"), "image.gif", "image/gif"],
		["AVIF", Buffer.from("ftypavif"), "image.avif", "image/avif"],
		["unknown signature", Buffer.from("not-an-image"), "image.bin", ""],
		["empty file", Buffer.from([]), "empty.jpg", "image/jpeg"],
		[
			"corrupt JPEG",
			Buffer.from([0xff, 0xd8, 0xff, 0xdb]),
			"broken.jpg",
			"image/jpeg",
		],
	])(
		"should reject %s",
		async (_label, bytes, fileName, declaredContentType) => {
			const file = buildFile(bytes, fileName, declaredContentType);

			await expect(parseSupportedImageFile(file)).rejects.toThrow(
				FileNotAllowedError,
			);
		},
	);
});
