import type { IImageProcessor } from "@s-hirano-ist/s-application/content/image-processor";
import { parseSupportedImageFile } from "@s-hirano-ist/s-application/content/image-upload-parser";
import { expect, test, vi } from "vitest";

function fixture(format = "png") {
	const processor: IImageProcessor = {
		getMetadata: vi.fn().mockResolvedValue({ format }),
		createThumbnail: vi.fn().mockResolvedValue(new Uint8Array([1])),
	};
	const file = new File(
		[new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
		"file.png",
		{ type: "image/png" },
	);
	return { processor, file };
}
test("rejects decoder/signature disagreement before thumbnail generation", async () => {
	const { processor, file } = fixture("jpeg");
	await expect(parseSupportedImageFile(file, processor)).rejects.toMatchObject({
		diagnostics: {
			reason: "detected-format-mismatch",
			detectedContentType: "image/png",
			decodedFormat: "jpeg",
		},
	});
	expect(processor.createThumbnail).not.toHaveBeenCalled();
});
test("an injected processor failure retains its phase diagnostics", async () => {
	const { processor, file } = fixture();
	vi.mocked(processor.createThumbnail).mockRejectedValue(
		new Error("decoder unavailable"),
	);
	await expect(parseSupportedImageFile(file, processor)).rejects.toMatchObject({
		diagnostics: {
			reason: "thumbnail-creation-failed",
			causeMessage: "decoder unavailable",
		},
	});
	expect(processor.createThumbnail).toHaveBeenCalledWith(
		expect.any(Uint8Array),
		192,
		192,
	);
});
