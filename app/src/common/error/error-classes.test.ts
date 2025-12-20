import { describe, expect, test } from "vitest";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "./error-classes";

describe("error-classes", () => {
	describe("UnexpectedError", () => {
		test("should create error with correct message and name", () => {
			const error = new UnexpectedError();
			expect(error.message).toBe("unexpected");
			expect(error.name).toBe("UnexpectedError");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("InvalidFormatError", () => {
		test("should create error with correct message and name", () => {
			const error = new InvalidFormatError();
			expect(error.message).toBe("invalidFormat");
			expect(error.name).toBe("InvalidFormatError");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("DuplicateError", () => {
		test("should create error with correct message and name", () => {
			const error = new DuplicateError();
			expect(error.message).toBe("duplicate");
			expect(error.name).toBe("DuplicateError");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("FileNotAllowedError", () => {
		test("should create error with correct message and name", () => {
			const error = new FileNotAllowedError();
			expect(error.message).toBe("invalidFileFormat");
			expect(error.name).toBe("FileNotAllowedError");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("error handling", () => {
		test("should allow all errors to be thrown and caught", () => {
			const errors = [
				new UnexpectedError(),
				new InvalidFormatError(),
				new DuplicateError(),
				new FileNotAllowedError(),
			];

			errors.forEach((errorInstance) => {
				expect(() => {
					throw errorInstance;
				}).toThrow(Error);
			});
		});

		test("errors should be distinguishable by type", () => {
			const unexpectedError = new UnexpectedError();
			const duplicateError = new DuplicateError();

			expect(unexpectedError).toBeInstanceOf(UnexpectedError);
			expect(unexpectedError).not.toBeInstanceOf(DuplicateError);

			expect(duplicateError).toBeInstanceOf(DuplicateError);
			expect(duplicateError).not.toBeInstanceOf(UnexpectedError);
		});
	});
});
