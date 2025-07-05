import { beforeEach, describe, expect, test, vi } from "vitest";
import { sendPushoverMessage } from "./fetch-message";

vi.mock("@/env", () => ({
	env: {
		PUSHOVER_URL: "https://api.pushover.net/1/messages.json",
		PUSHOVER_USER_KEY: "test-user-key",
		PUSHOVER_APP_TOKEN: "test-app-token",
	},
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("fetch-message", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("sendPushoverMessage", () => {
		test("should send message successfully", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
			});

			await sendPushoverMessage("Test message");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.pushover.net/1/messages.json",
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						token: "test-app-token",
						user: "test-user-key",
						message: "Test message",
					}),
				},
			);
		});

		test("should handle API failure response and log error", async () => {
			const { loggerError } = await import("@/pino");

			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
			});

			await sendPushoverMessage("Test message");

			// Should log error when API fails
			expect(loggerError).toHaveBeenCalled();
		});

		test("should handle network error", async () => {
			const { loggerError } = await import("@/pino");
			const networkError = new Error("Network error");
			mockFetch.mockRejectedValue(networkError);

			await sendPushoverMessage("Test message");

			expect(loggerError).toHaveBeenCalled();
		});

		test("should handle various error scenarios", async () => {
			const { loggerError } = await import("@/pino");

			// Test timeout error
			const timeoutError = new Error("Request timeout");
			mockFetch.mockRejectedValue(timeoutError);

			await sendPushoverMessage("Test message");

			expect(loggerError).toHaveBeenCalled();
		});

		test("should format request body correctly", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
			});

			await sendPushoverMessage("Message with special chars: @#$%");

			const call = mockFetch.mock.calls[0];
			const body = call[1].body;

			expect(body).toBeInstanceOf(URLSearchParams);
			expect(body.get("token")).toBe("test-app-token");
			expect(body.get("user")).toBe("test-user-key");
			expect(body.get("message")).toBe("Message with special chars: @#$%");
		});

		test("should handle empty message", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
			});

			await sendPushoverMessage("");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.pushover.net/1/messages.json",
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						token: "test-app-token",
						user: "test-user-key",
						message: "",
					}),
				},
			);
		});

		test("should not throw errors (as per comment)", async () => {
			mockFetch.mockRejectedValue(new Error("Some error"));

			// Should not throw
			await expect(sendPushoverMessage("Test message")).resolves.not.toThrow();
		});
	});
});
