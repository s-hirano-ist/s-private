import {
	convertToWebp,
	createWebpThumbnail,
	readImageMetadata,
} from "@s-hirano-ist/s-image-processing/node";
import { describe, expect, test } from "vitest";

const PNG_BYTES = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4AQEFAPr/AP8AAP8FAAH/+lyI0QAAAABJRU5ErkJggg==",
	"base64",
);

function isWebp(bytes: Uint8Array): boolean {
	return (
		bytes.length >= 12 &&
		Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
		Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
	);
}

describe("Photon image processing for scripts", () => {
	test("should read metadata and create a WebP thumbnail from fixture bytes", async () => {
		const metadata = await readImageMetadata(PNG_BYTES);
		const thumbnailBytes = await createWebpThumbnail(PNG_BYTES, {
			width: 192,
			height: 192,
		});

		expect(metadata).toEqual({ width: 1, height: 1, format: "png" });
		expect(isWebp(thumbnailBytes)).toBe(true);
	});

	test("should convert fixture bytes to WebP", async () => {
		const webpBytes = await convertToWebp(PNG_BYTES);

		expect(isWebp(webpBytes)).toBe(true);
	});

	test("should reject GIF fixture bytes", async () => {
		await expect(readImageMetadata(Buffer.from("GIF89a"))).rejects.toThrow(
			"Unsupported image signature.",
		);
	});
});
