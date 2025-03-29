import { PushoverError } from "@/error-classes";
import { loggerError } from "@/pino";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { sendPushoverMessage } from "./fetch-message";

// FIXME: GitHub actionsでURLがマスキングされて見えなくなる問題
describe.skip("sendPushoverMessage", () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		globalThis.fetch = mockFetch;
	});

	test("should send a message successfully when API responds with 200", async () => {
		mockFetch.mockResolvedValueOnce({
			status: 200,
		});
		const message = "Hello Pushover!";

		await sendPushoverMessage(message);

		expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: "Bearer secretToken",
			},
			body: expect.any(URLSearchParams),
		});
		expect(mockFetch.mock.calls[0][1]?.body.toString()).toContain(
			"message=Hello+LINE+Notify%21",
		);
	});

	test("should not throw LineNotifyError when API responds with non-200 status", async () => {
		mockFetch.mockResolvedValueOnce({
			status: 400,
		});
		const message = "Hello Pushover!";

		await expect(sendPushoverMessage(message)).resolves.not.toThrow(
			PushoverError,
		);

		expect(loggerError).toHaveBeenCalledWith(
			"ログの送信でエラーが発生しました。",
			{
				caller: "sendLineMessageError",
				status: 500,
			},
		);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	test("should log an error when fetch fails", async () => {
		mockFetch.mockRejectedValue(new Error("fetch failed"));

		await sendPushoverMessage("test error");

		expect(loggerError).toHaveBeenCalledWith(
			"Send line message failed with unknown error",
			{
				caller: "sendLineMessageUnknownError",
				status: 500,
			},
			expect.any(Error),
		);
	});
});
