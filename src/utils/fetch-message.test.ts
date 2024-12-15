import { LineNotifyError } from "@/error-classes";
import { loggerError } from "@/pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendLineNotifyMessage } from "./fetch-message";

describe("sendLineNotifyMessage", () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
	});

	it("should send a message successfully when API responds with 200", async () => {
		mockFetch.mockResolvedValueOnce({
			status: 200,
		});
		const message = "Hello LINE Notify!";

		await sendLineNotifyMessage(message);

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
		); // encoded message
	});

	it("should not throw LineNotifyError when API responds with non-200 status", async () => {
		mockFetch.mockResolvedValueOnce({
			status: 400,
		});
		const message = "Hello LINE Notify!";

		await expect(sendLineNotifyMessage(message)).resolves.not.toThrow(
			LineNotifyError,
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

	it("should log an error when fetch fails", async () => {
		mockFetch.mockRejectedValue(new Error("fetch failed"));

		await sendLineNotifyMessage("test error");

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
