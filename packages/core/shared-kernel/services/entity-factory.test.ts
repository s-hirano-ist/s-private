import {
	InvalidFormatError,
	UnexpectedError,
} from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { createEntityWithErrorHandling } from "@s-hirano-ist/s-core/shared-kernel/services/entity-factory";
import { describe, expect, test } from "vitest";
import { z } from "zod";

describe("createEntityWithErrorHandling", () => {
	test("should return result when factory succeeds", () => {
		const mockEntity = { id: "test-id", value: "test-value" };
		const factory = () => mockEntity;

		const result = createEntityWithErrorHandling(factory);

		expect(result).toBe(mockEntity);
	});

	test("should throw InvalidFormatError when ZodError occurs", () => {
		const schema = z.string();
		const factory = () => schema.parse(123); // This will throw ZodError

		expect(() => createEntityWithErrorHandling(factory)).toThrow(
			InvalidFormatError,
		);
	});

	test("should throw UnexpectedError when other error occurs", () => {
		const factory = () => {
			throw new Error("Some unexpected error");
		};

		expect(() => createEntityWithErrorHandling(factory)).toThrow(
			UnexpectedError,
		);
	});

	test("should throw UnexpectedError when TypeError occurs", () => {
		const factory = () => {
			throw new TypeError("Type error");
		};

		expect(() => createEntityWithErrorHandling(factory)).toThrow(
			UnexpectedError,
		);
	});
});
