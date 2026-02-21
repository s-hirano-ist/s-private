import { describe, expect, test } from "vitest";
import { idGenerator, uuidv7 } from "./id-generator.ts";

describe("IdGenerator", () => {
	test("should generate valid UUIDv7 using function", () => {
		const id = uuidv7();

		// UUIDv7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(id).toHaveLength(36);
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
