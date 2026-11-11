import type { NotificationConfig, NotificationContext } from "./types.js";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { createPushoverService } from "./pushover.js";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PushoverService", () => {
	const mockConfig: NotificationConfig = {
		url: "https://api.pushover.net/1/messages.json",
		userKey: "test_user_key",
		appToken: "test_app_token",
	};

	const mockContext: NotificationContext = {
		caller: "TestService",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
		});
	});

	test("should send error notification with high priority", async () => {
		const service = createPushoverService(mockConfig);

		await service.notifyError("Test error message", mockContext);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				signal: expect.any(AbortSignal),
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
		const service = createPushoverService(mockConfig);

		await service.notifyWarning("Test warning message", mockContext);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				signal: expect.any(AbortSignal),
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
		const service = createPushoverService(mockConfig);

		await service.notifyInfo("Test info message", mockContext);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.pushover.net/1/messages.json",
			{
				method: "POST",
				signal: expect.any(AbortSignal),
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

	test("propagates HTTP delivery failures", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 400,
		});

		const service = createPushoverService(mockConfig);

		// Delivery failures are handled by the host logger.
		await expect(
			service.notifyError("Test error", mockContext),
		).rejects.toThrow("notificationSend");
	});

	test("propagates network delivery failures", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		const service = createPushoverService(mockConfig);

		// Delivery failures are handled by the host logger.
		await expect(
			service.notifyWarning("Test warning", mockContext),
		).rejects.toThrow("Network error");
	});

	test("propagates unexpected delivery failures", async () => {
		mockFetch.mockImplementation(() => {
			throw new TypeError("Unexpected error");
		});

		const service = createPushoverService(mockConfig);

		// Delivery failures are handled by the host logger.
		await expect(service.notifyInfo("Test info", mockContext)).rejects.toThrow(
			"Unexpected error",
		);
	});

	test("should include context caller in message", async () => {
		const service = createPushoverService(mockConfig);

		const customContext: NotificationContext = {
			caller: "CustomService",
		};

		await service.notifyError("Test message", customContext);

		const callArgs = mockFetch.mock.calls[0][1];
		const body = callArgs.body as URLSearchParams;
		expect(body.get("message")).toBe("[ERROR] CustomService: Test message");
	});

	test("should use provided config values", async () => {
		const customConfig: NotificationConfig = {
			url: "https://custom.api.com/notify",
			userKey: "custom_user",
			appToken: "custom_token",
		};

		const service = createPushoverService(customConfig);

		await service.notifyInfo("Test", mockContext);

		expect(mockFetch).toHaveBeenCalledWith("https://custom.api.com/notify", {
			method: "POST",
			signal: expect.any(AbortSignal),
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				token: "custom_token",
				user: "custom_user",
				message: "[INFO] TestService: Test",
				priority: "-1",
			}),
		});
	});
});
