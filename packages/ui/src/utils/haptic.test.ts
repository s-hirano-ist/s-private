import { describe, expect, test } from "vite-plus/test";
import { haptic } from "./haptic.js";

describe("haptic", () => {
	test("is safe when vibration is unavailable", () => {
		expect(() => haptic()).not.toThrow();
	});
});
