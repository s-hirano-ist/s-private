import { describe, expect, it } from "vitest";
import { ISBN, isbnValidationRules } from "../isbn";

describe("ISBN Value Object", () => {
	describe("creation", () => {
		it("should create valid ISBN-10", () => {
			const isbn = ISBN.create("0123456789");
			expect(isbn).toBeDefined();
		});

		it("should create valid ISBN-13", () => {
			const isbn = ISBN.create("9780123456786");
			expect(isbn).toBeDefined();
		});

		it("should create ISBN with hyphens", () => {
			const isbn = ISBN.create("978-0-12-345678-6");
			expect(isbn).toBeDefined();
		});

		it("should throw for invalid format", () => {
			expect(() => ISBN.create("invalid")).toThrow();
		});

		it("should throw for wrong length", () => {
			expect(() => ISBN.create("123")).toThrow();
		});
	});

	describe("validation rules", () => {
		it("should validate format correctly", () => {
			expect(isbnValidationRules.isValidFormat("0123456789")).toBe(true);
			expect(isbnValidationRules.isValidFormat("978-0-12-345678-6")).toBe(true);
			expect(isbnValidationRules.isValidFormat("invalid-isbn")).toBe(false);
		});

		it("should validate length correctly", () => {
			expect(isbnValidationRules.isValidLength("0123456789")).toBe(true);
			expect(isbnValidationRules.isValidLength("9780123456786")).toBe(true);
			expect(isbnValidationRules.isValidLength("123")).toBe(false);
		});

		it("should normalize ISBN", () => {
			expect(isbnValidationRules.normalize("978-0-12-345678-6")).toBe(
				"9780123456786",
			);
			expect(isbnValidationRules.normalize("0-12-345678-9")).toBe("0123456789");
		});

		it("should format ISBN", () => {
			expect(isbnValidationRules.format("0123456789")).toBe("012-345678-9");
			expect(isbnValidationRules.format("9780123456786")).toBe(
				"978-0-12345-678-6",
			);
		});
	});

	describe("safe parsing", () => {
		it("should return success for valid ISBN", () => {
			const result = ISBN.safeParse("9780123456786");
			expect(result.success).toBe(true);
		});

		it("should return error for invalid ISBN", () => {
			const result = ISBN.safeParse("invalid");
			expect(result.success).toBe(false);
		});
	});
});
