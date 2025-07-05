import { describe, expect, test } from "vitest";
import {
	NotAllowedError,
	PushoverError,
	UnauthorizedError,
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

	describe("NotAllowedError", () => {
		test("should create NotAllowedError with correct message and name", () => {
			const error = new NotAllowedError();

			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("notAllowed");
			expect(error.name).toBe("NotAllowedError");
		});

		test("should be instance of Error", () => {
			const error = new NotAllowedError();

			expect(error instanceof Error).toBe(true);
		});
	});

	describe("UnauthorizedError", () => {
		test("should create UnauthorizedError with correct message and name", () => {
			const error = new UnauthorizedError();

			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("unauthorized");
			expect(error.name).toBe("UnauthorizedError");
		});

		test("should be instance of Error", () => {
			const error = new UnauthorizedError();

			expect(error instanceof Error).toBe(true);
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

		test("should allow NotAllowedError to be caught as Error", () => {
			try {
				throw new NotAllowedError();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error).toBeInstanceOf(NotAllowedError);
			}
		});

		test("should allow UnauthorizedError to be caught as Error", () => {
			try {
				throw new UnauthorizedError();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error).toBeInstanceOf(UnauthorizedError);
			}
		});
	});

	describe("error differentiation", () => {
		test("should differentiate between error types", () => {
			const pushoverError = new PushoverError();
			const notAllowedError = new NotAllowedError();
			const unauthorizedError = new UnauthorizedError();

			expect(pushoverError instanceof PushoverError).toBe(true);
			expect(pushoverError instanceof NotAllowedError).toBe(false);
			expect(pushoverError instanceof UnauthorizedError).toBe(false);

			expect(notAllowedError instanceof NotAllowedError).toBe(true);
			expect(notAllowedError instanceof PushoverError).toBe(false);
			expect(notAllowedError instanceof UnauthorizedError).toBe(false);

			expect(unauthorizedError instanceof UnauthorizedError).toBe(true);
			expect(unauthorizedError instanceof PushoverError).toBe(false);
			expect(unauthorizedError instanceof NotAllowedError).toBe(false);
		});
	});
});
