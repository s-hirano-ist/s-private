import { describe, expect, test } from "vitest";
import { haptic } from "./haptic.js";

describe("haptic", () => {
	test("is safe when vibration is unavailable", () => {
		expect(() => haptic()).not.toThrow();
	});
});
