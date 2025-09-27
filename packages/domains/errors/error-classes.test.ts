import { describe, expect, test } from "vitest";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	PushoverError,
	UnexpectedError,
} from "./error-classes";

describe("error-classes", () => {
	describe("PushoverError", () => {
		test("should create PushoverError with correct message and name", () => {
			const error = new PushoverError();

			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("pushoverSend");
			expect(error.name).toBe("PushoverError");
		});

		test("should be instance of Error", () => {
			const error = new PushoverError();

			expect(error instanceof Error).toBe(true);
		});
	});

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
		test("should allow PushoverError to be caught as Error", () => {
			try {
				throw new PushoverError();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error).toBeInstanceOf(PushoverError);
			}
		});

		test("should allow all errors to be thrown and caught", () => {
			const errors = [
				new PushoverError(),
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
			const pushoverError = new PushoverError();
			const unexpectedError = new UnexpectedError();

			expect(pushoverError).toBeInstanceOf(PushoverError);
			expect(pushoverError).not.toBeInstanceOf(UnexpectedError);

			expect(unexpectedError).toBeInstanceOf(UnexpectedError);
			expect(unexpectedError).not.toBeInstanceOf(PushoverError);
		});
	});
});
