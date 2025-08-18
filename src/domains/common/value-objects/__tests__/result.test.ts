import { describe, expect, it } from "vitest";
import { Result } from "../result";

describe("Result", () => {
	describe("creation", () => {
		it("should create success result", () => {
			const result = Result.success("value");
			expect(result.isSuccess).toBe(true);
			expect(result.isFailure).toBe(false);
			expect(result.value).toBe("value");
		});

		it("should create failure result", () => {
			const error = new Error("test error");
			const result = Result.failure(error);
			expect(result.isSuccess).toBe(false);
			expect(result.isFailure).toBe(true);
			expect(result.error).toBe(error);
		});
	});

	describe("mapping", () => {
		it("should map success value", () => {
			const result = Result.success(5);
			const mapped = Result.map(result, (x) => x * 2);
			expect(mapped.isSuccess).toBe(true);
			expect(mapped.value).toBe(10);
		});

		it("should not map failure", () => {
			const error = new Error("test");
			const result = Result.failure(error);
			const mapped = Result.map(result, (x) => x * 2);
			expect(mapped.isFailure).toBe(true);
			expect(mapped.error).toBe(error);
		});
	});

	describe("flatMap", () => {
		it("should flatMap success value", () => {
			const result = Result.success(5);
			const flatMapped = Result.flatMap(result, (x) => Result.success(x * 2));
			expect(flatMapped.isSuccess).toBe(true);
			expect(flatMapped.value).toBe(10);
		});

		it("should handle failure in flatMap", () => {
			const result = Result.success(5);
			const error = new Error("test");
			const flatMapped = Result.flatMap(result, () => Result.failure(error));
			expect(flatMapped.isFailure).toBe(true);
			expect(flatMapped.error).toBe(error);
		});

		it("should not flatMap failure", () => {
			const error = new Error("test");
			const result = Result.failure(error);
			const flatMapped = Result.flatMap(result, (x) => Result.success(x * 2));
			expect(flatMapped.isFailure).toBe(true);
			expect(flatMapped.error).toBe(error);
		});
	});

	describe("match", () => {
		it("should match success", () => {
			const result = Result.success(5);
			const matched = Result.match(result, {
				success: (x) => `success: ${x}`,
				failure: () => "failure",
			});
			expect(matched).toBe("success: 5");
		});

		it("should match failure", () => {
			const error = new Error("test");
			const result = Result.failure(error);
			const matched = Result.match(result, {
				success: () => "success",
				failure: (e) => `failure: ${e.message}`,
			});
			expect(matched).toBe("failure: test");
		});
	});

	describe("fromThrowable", () => {
		it("should handle successful function", () => {
			const result = Result.fromThrowable(() => 5);
			expect(result.isSuccess).toBe(true);
			expect(result.value).toBe(5);
		});

		it("should handle throwing function", () => {
			const result = Result.fromThrowable(() => {
				throw new Error("test error");
			});
			expect(result.isFailure).toBe(true);
			expect((result.error as Error).message).toBe("test error");
		});
	});

	describe("unwrap", () => {
		it("should unwrap success value", () => {
			const result = Result.success(5);
			expect(Result.unwrap(result)).toBe(5);
		});

		it("should throw on failure unwrap", () => {
			const result = Result.failure(new Error("test"));
			expect(() => Result.unwrap(result)).toThrow();
		});
	});

	describe("unwrapOr", () => {
		it("should unwrap success value", () => {
			const result = Result.success(5);
			expect(Result.unwrapOr(result, 10)).toBe(5);
		});

		it("should return default on failure", () => {
			const result = Result.failure(new Error("test"));
			expect(Result.unwrapOr(result, 10)).toBe(10);
		});
	});
});
