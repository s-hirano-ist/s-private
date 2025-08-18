import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the env module
vi.mock("@/env", () => ({
	env: {
		PUSHOVER_URL: "https://api.pushover.net/1/messages.json",
		PUSHOVER_USER_KEY: "test_user_key",
		PUSHOVER_APP_TOKEN: "test_app_token",
	},
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid noise in tests
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("PushoverMonitoringService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
		});
	});

	const mockContext = {
		caller: "TestService",
		timestamp: new Date().toISOString(),
	};

	test("should send error notification with high priority", async () => {
		const { pushoverMonitoringService } = await import("./pushover.service");

		await pushoverMonitoringService.notifyError(
			"Test error message",
			mockContext,
		);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					token: "test_app_token",
					user: "test_user_key",
					message: "[ERROR] TestService: Test error message",
					priority: "1",
				}),
			},
		);
	});

	test("should send warning notification with normal priority", async () => {
		const { pushoverMonitoringService } = await import("./pushover.service");

		await pushoverMonitoringService.notifyWarning(
			"Test warning message",
			mockContext,
		);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					token: "test_app_token",
					user: "test_user_key",
					message: "[WARN] TestService: Test warning message",
					priority: "0",
				}),
			},
		);
	});

	test("should send info notification with low priority", async () => {
		const { pushoverMonitoringService } = await import("./pushover.service");

		await pushoverMonitoringService.notifyInfo(
			"Test info message",
			mockContext,
		);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					token: "test_app_token",
					user: "test_user_key",
					message: "[INFO] TestService: Test info message",
					priority: "-1",
				}),
			},
		);
	});

	test("should handle PushoverError gracefully", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 400,
		});

		const { pushoverMonitoringService } = await import("./pushover.service");

		// Should not throw
		await expect(
			pushoverMonitoringService.notifyError("Test error", mockContext),
		).resolves.toBeUndefined();

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("[PushoverService] Failed to send notification:"),
		);
	});

	test("should handle fetch errors gracefully", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		const { pushoverMonitoringService } = await import("./pushover.service");

		// Should not throw
		await expect(
			pushoverMonitoringService.notifyWarning("Test warning", mockContext),
		).resolves.toBeUndefined();

		expect(consoleSpy).toHaveBeenCalledWith(
			"[PushoverService] Unknown error occurred while sending notification:",
			expect.any(Error),
		);
	});

	test("should handle unexpected errors gracefully", async () => {
		mockFetch.mockImplementation(() => {
			throw new TypeError("Unexpected error");
		});

		const { pushoverMonitoringService } = await import("./pushover.service");

		// Should not throw
		await expect(
			pushoverMonitoringService.notifyInfo("Test info", mockContext),
		).resolves.toBeUndefined();

		expect(consoleSpy).toHaveBeenCalledWith(
			"[PushoverService] Unknown error occurred while sending notification:",
			expect.any(TypeError),
		);
	});

	test("should include context caller in message", async () => {
		const { pushoverMonitoringService } = await import("./pushover.service");

		const customContext = {
			caller: "CustomService",
			timestamp: new Date().toISOString(),
		};

		await pushoverMonitoringService.notifyError("Test message", customContext);

		const callArgs = mockFetch.mock.calls[0][1];
		const body = callArgs.body as URLSearchParams;
		expect(body.get("message")).toBe("[ERROR] CustomService: Test message");
	});
});
