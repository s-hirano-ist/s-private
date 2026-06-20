import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { parseSupportedImageFile } from "./image-upload-parser";

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
	const arrayBuffer = new ArrayBuffer(buffer.byteLength);
	new Uint8Array(arrayBuffer).set(buffer);
	return arrayBuffer;
}

describe("parseSupportedImageFile", () => {
	test("should parse a JPEG file with no browser-provided content type", async () => {
		const jpegBuffer = await sharp({
			create: {
				width: 10,
				height: 10,
				channels: 3,
				background: { r: 255, g: 255, b: 255 },
			},
		})
			.jpeg()
			.toBuffer();
		const file = new File([toArrayBuffer(jpegBuffer)], "generated.jpg", {
			type: "",
		});

		const result = await parseSupportedImageFile(file);

		expect(result.contentType).toBe("image/jpeg");
		expect(result.originalBuffer).toEqual(jpegBuffer);
		expect(result.thumbnailBuffer.length).toBeGreaterThan(0);
	});

	test("should reject an unsupported signature before thumbnail creation", async () => {
		const file = new File([Buffer.from("ftypavif")], "image.avif", {
			type: "image/avif",
		});

		await expect(parseSupportedImageFile(file)).rejects.toThrow(
			FileNotAllowedError,
		);
	});

	test("should use the tolerant sharp processor options for thumbnails", async () => {
		const jpegBuffer = await sharp({
			create: {
				width: 10,
				height: 10,
				channels: 3,
				background: { r: 0, g: 0, b: 0 },
			},
		})
			.jpeg()
			.toBuffer();

		await expect(
			sharpImageProcessor.createThumbnail(jpegBuffer, 192, 192),
		).resolves.toBeInstanceOf(Buffer);
	});
});
