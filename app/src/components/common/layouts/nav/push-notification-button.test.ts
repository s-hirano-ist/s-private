import { describe, expect, test } from "vitest";
import { feedbackKeyForFailure } from "./push-notification-button";

describe("feedbackKeyForFailure", () => {
	test.each([
		["register", "pushRegistrationError"],
		["subscribe", "pushSubscriptionError"],
		["save", "pushSaveError"],
	] as const)("maps %s failures to %s", (stage, expectedKey) => {
		expect(feedbackKeyForFailure(stage)).toBe(expectedKey);
	});
});
