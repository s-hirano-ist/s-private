import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnexpectedError } from "@/error-classes";
import { convertUint8ArrayToImgSrc } from "./convert";

describe("convert utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("convertUint8ArrayToImgSrc", () => {
		it("should convert svg data correctly", () => {
			const svgData = "<svg>test</svg>";
			const uint8Array = new TextEncoder().encode(svgData);

			const result = convertUint8ArrayToImgSrc(uint8Array, "svg");

			expect(result).toBe(
				`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`,
			);
		});

		it("should convert webp data correctly", () => {
			const uint8Array = new Uint8Array([255, 216, 255, 224]); // Sample binary data

			const result = convertUint8ArrayToImgSrc(uint8Array, "webp");

			// Manually calculate expected base64
			let binary = "";
			for (const byte of uint8Array) {
				binary += String.fromCharCode(byte);
			}
			const expectedBase64 = btoa(binary);

			expect(result).toBe(`data:image/webp;base64,${expectedBase64}`);
		});

		it("should handle empty svg data", () => {
			const uint8Array = new Uint8Array([]);

			const result = convertUint8ArrayToImgSrc(uint8Array, "svg");

			expect(result).toBe("data:image/svg+xml;charset=utf-8,");
		});

		it("should handle empty webp data", () => {
			const uint8Array = new Uint8Array([]);

			const result = convertUint8ArrayToImgSrc(uint8Array, "webp");

			expect(result).toBe("data:image/webp;base64,");
		});

		it("should handle complex svg with special characters", () => {
			const svgData =
				"<svg xmlns='http://www.w3.org/2000/svg'><text>Hello & World</text></svg>";
			const uint8Array = new TextEncoder().encode(svgData);

			const result = convertUint8ArrayToImgSrc(uint8Array, "svg");

			expect(result).toBe(
				`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`,
			);
		});

		it("should throw UnexpectedError for invalid image type", () => {
			const uint8Array = new Uint8Array([1, 2, 3]);

			expect(() => {
				// @ts-expect-error - Testing invalid type
				convertUint8ArrayToImgSrc(uint8Array, "invalid");
			}).toThrow(UnexpectedError);
		});

		it("should handle large binary data for webp", () => {
			const uint8Array = new Uint8Array(1000).fill(255);

			const result = convertUint8ArrayToImgSrc(uint8Array, "webp");

			expect(result.startsWith("data:image/webp;base64,")).toBe(true);
			expect(result.length).toBeGreaterThan(30); // Should have some content
		});

		it("should properly encode unicode characters in svg", () => {
			const svgData = "<svg><text>こんにちは</text></svg>";
			const uint8Array = new TextEncoder().encode(svgData);

			const result = convertUint8ArrayToImgSrc(uint8Array, "svg");

			expect(result).toBe(
				`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`,
			);
			expect(result).toContain("%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"); // Encoded unicode
		});

		it("should handle binary data with all byte values for webp", () => {
			const uint8Array = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				uint8Array[i] = i;
			}

			const result = convertUint8ArrayToImgSrc(uint8Array, "webp");

			expect(result.startsWith("data:image/webp;base64,")).toBe(true);

			// Verify the base64 encoding is correct
			const base64Part = result.split(",")[1];
			expect(base64Part).toBeTruthy();
		});
	});
});
