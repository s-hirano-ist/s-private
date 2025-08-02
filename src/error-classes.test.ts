import { describe, expect, test } from "vitest";
import { PushoverError } from "./error-classes";

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

	describe("error handling", () => {
		test("should allow PushoverError to be caught as Error", () => {
			try {
				throw new PushoverError();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error).toBeInstanceOf(PushoverError);
			}
		});
	});
});
