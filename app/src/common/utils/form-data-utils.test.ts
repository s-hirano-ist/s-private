import { beforeEach, describe, expect, test, vi } from "vitest";
import { InvalidFormatError } from "@/common/error/error-classes";
import { getFormDataFile, getFormDataString } from "./form-data-utils";

describe("form-data-utils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getFormDataString", () => {
		test("should return string value from FormData", () => {
			const formData = new FormData();
			formData.set("testKey", "testValue");

			const result = getFormDataString(formData, "testKey");

			expect(result).toBe("testValue");
		});

		test("should return empty string from FormData", () => {
			const formData = new FormData();
			formData.set("testKey", "");

			const result = getFormDataString(formData, "testKey");

			expect(result).toBe("");
		});

		test("should throw InvalidFormatError when value is not a string", () => {
			const formData = new FormData();
			const file = new File(["content"], "test.txt", { type: "text/plain" });
			formData.set("testKey", file);

			expect(() => getFormDataString(formData, "testKey")).toThrow(
				InvalidFormatError,
			);
		});

		test("should throw InvalidFormatError when key does not exist", () => {
			const formData = new FormData();

			expect(() => getFormDataString(formData, "nonExistentKey")).toThrow(
				InvalidFormatError,
			);
		});

		test("should handle special characters in string values", () => {
			const formData = new FormData();
			const specialValue = 'Value with "quotes" & <symbols>';
			formData.set("testKey", specialValue);

			const result = getFormDataString(formData, "testKey");

			expect(result).toBe(specialValue);
		});

		test("should handle unicode characters", () => {
			const formData = new FormData();
			const unicodeValue = "日本語のテキスト";
			formData.set("testKey", unicodeValue);

			const result = getFormDataString(formData, "testKey");

			expect(result).toBe(unicodeValue);
		});
	});

	describe("getFormDataFile", () => {
		test("should return File from FormData", () => {
			const formData = new FormData();
			const file = new File(["content"], "test.txt", { type: "text/plain" });
			formData.set("testKey", file);

			const result = getFormDataFile(formData, "testKey");

			expect(result).toBe(file);
			expect(result.name).toBe("test.txt");
			expect(result.type).toBe("text/plain");
		});

		test("should return image File from FormData", () => {
			const formData = new FormData();
			const imageFile = new File(["image content"], "image.png", {
				type: "image/png",
			});
			formData.set("fileKey", imageFile);

			const result = getFormDataFile(formData, "fileKey");

			expect(result).toBe(imageFile);
			expect(result.name).toBe("image.png");
			expect(result.type).toBe("image/png");
		});

		test("should throw InvalidFormatError when value is not a File", () => {
			const formData = new FormData();
			formData.set("testKey", "stringValue");

			expect(() => getFormDataFile(formData, "testKey")).toThrow(
				InvalidFormatError,
			);
		});

		test("should throw InvalidFormatError when key does not exist", () => {
			const formData = new FormData();

			expect(() => getFormDataFile(formData, "nonExistentKey")).toThrow(
				InvalidFormatError,
			);
		});

		test("should handle File with special characters in name", () => {
			const formData = new FormData();
			const file = new File(["content"], "file with spaces & symbols.txt", {
				type: "text/plain",
			});
			formData.set("testKey", file);

			const result = getFormDataFile(formData, "testKey");

			expect(result.name).toBe("file with spaces & symbols.txt");
		});

		test("should handle File with unicode name", () => {
			const formData = new FormData();
			const file = new File(["content"], "日本語ファイル.txt", {
				type: "text/plain",
			});
			formData.set("testKey", file);

			const result = getFormDataFile(formData, "testKey");

			expect(result.name).toBe("日本語ファイル.txt");
		});

		test("should handle large File", () => {
			const formData = new FormData();
			const largeContent = "a".repeat(10000);
			const file = new File([largeContent], "large.txt", {
				type: "text/plain",
			});
			formData.set("testKey", file);

			const result = getFormDataFile(formData, "testKey");

			expect(result.size).toBe(10000);
			expect(result.name).toBe("large.txt");
		});
	});
});
