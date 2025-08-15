import { describe, expect, test } from "vitest";
import { sanitizeFileName } from "./images-domain-service";

describe("sanitizeFileName", () => {
	test("should remove invalid characters from the file name", () => {
		const fileName = "test*File:Name?.txt";
		const sanitized = sanitizeFileName(fileName);
		expect(sanitized).toBe("testFileName.txt");
	});

	test("should allow valid characters", () => {
		const fileName = "valid-file_name123.txt";
		const sanitized = sanitizeFileName(fileName);
		expect(sanitized).toBe(fileName);
	});

	test("should return an empty string if fileName contains only invalid characters", () => {
		const fileName = "****????";
		const sanitized = sanitizeFileName(fileName);
		expect(sanitized).toBe("");
	});

	test("should handle empty file names", () => {
		const fileName = "";
		const sanitized = sanitizeFileName(fileName);
		expect(sanitized).toBe("");
	});

	test("should handle file names with no invalid characters", () => {
		const fileName = "simpleFile.txt";
		const sanitized = sanitizeFileName(fileName);
		expect(sanitized).toBe(fileName);
	});
});
