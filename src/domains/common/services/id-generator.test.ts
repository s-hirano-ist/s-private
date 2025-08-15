import { describe, expect, test } from "vitest";
import { IdGenerator, idGenerator } from "./id-generator";

describe("IdGenerator", () => {
	test("should generate valid UUIDv7", () => {
		const generator = new IdGenerator();
		const id = generator.uuidv7();

		// UUIDv7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(id).toHaveLength(36);
	});

	test("should generate unique IDs", () => {
		const generator = new IdGenerator();
		const id1 = generator.uuidv7();
		const id2 = generator.uuidv7();

		expect(id1).not.toBe(id2);
	});

	test("exported instance should work correctly", () => {
		const id = idGenerator.uuidv7();

		// UUIDv7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(id).toHaveLength(36);
	});
});
