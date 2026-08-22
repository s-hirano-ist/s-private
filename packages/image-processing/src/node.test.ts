import sharp from "sharp";
import { describe, expect, test } from "vitest";
import {
	convertToWebp,
	createWebpThumbnail,
	readImageMetadata,
} from "./node.js";

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

async function createNoisePng(): Promise<Buffer> {
	const width = 64;
	const height = 64;
	const channels = 3;
	const pixels = Buffer.alloc(width * height * channels);
	for (let index = 0; index < pixels.length; index++) {
		pixels[index] = (index * 31 + Math.floor(index / 7) * 17) % 256;
	}
	return await sharp(pixels, { raw: { channels, height, width } })
		.png()
		.toBuffer();
}

describe("Sharp image processing", () => {
	test("reads supported metadata and creates an exact-size WebP thumbnail", async () => {
		const metadata = await readImageMetadata(PNG_BYTES);
		const thumbnailBytes = await createWebpThumbnail(PNG_BYTES, {
			width: 192,
			height: 192,
		});
		const thumbnailMetadata = await readImageMetadata(thumbnailBytes);

		expect(metadata).toEqual({ width: 1, height: 1, format: "png" });
		expect(thumbnailMetadata).toEqual({
			width: 192,
			height: 192,
			format: "webp",
		});
		expect(isWebp(thumbnailBytes)).toBe(true);
	});

	test.each([
		{ height: 20, width: 40 },
		{ height: 40, width: 20 },
	])("centre-crops a $width x $height image", async ({ height, width }) => {
		const source = await sharp({
			create: {
				background: "#336699",
				channels: 3,
				height,
				width,
			},
		})
			.png()
			.toBuffer();
		const thumbnail = await createWebpThumbnail(source, {
			height: 16,
			width: 16,
		});

		await expect(readImageMetadata(thumbnail)).resolves.toEqual({
			format: "webp",
			height: 16,
			width: 16,
		});
	});

	test("reports dimensions after applying EXIF orientation", async () => {
		const orientedJpeg = await sharp({
			create: {
				background: "#336699",
				channels: 3,
				height: 30,
				width: 20,
			},
		})
			.jpeg()
			.withMetadata({ orientation: 6 })
			.toBuffer();

		await expect(readImageMetadata(orientedJpeg)).resolves.toEqual({
			format: "jpeg",
			height: 20,
			width: 30,
		});
	});

	test("honours WebP quality", async () => {
		const source = await createNoisePng();
		const lowQuality = await convertToWebp(source, { quality: 10 });
		const highQuality = await convertToWebp(source, { quality: 100 });

		expect(isWebp(lowQuality)).toBe(true);
		expect(isWebp(highQuality)).toBe(true);
		expect(highQuality.byteLength).toBeGreaterThan(lowQuality.byteLength);
	});

	test("rejects unsupported image signatures", async () => {
		await expect(readImageMetadata(Buffer.from("GIF89a"))).rejects.toThrow(
			"Unsupported image signature.",
		);
	});
});
