import { describe, expect, test } from "vitest";
import { normalizeAuthErrorCode } from "./auth-error-code";

describe("normalizeAuthErrorCode", () => {
	test.each(["state_mismatch", "invalid-code", "CODE_123"])(
		"keeps the valid error code %s",
		(errorCode) => {
			expect(normalizeAuthErrorCode(errorCode)).toBe(errorCode);
		},
	);

	test.each([
		["missing", undefined],
		["empty", ""],
		["invalid characters", "invalid code!"],
		["too long", "a".repeat(65)],
	])("returns unknown when the error code is %s", (_case, errorCode) => {
		expect(normalizeAuthErrorCode(errorCode)).toBe("unknown");
	});

	test("uses the first value when the query parameter is repeated", () => {
		expect(normalizeAuthErrorCode(["invalid_code", "ignored"])).toBe(
			"invalid_code",
		);
	});
});
