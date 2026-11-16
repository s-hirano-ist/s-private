import { createRssFailureReporter } from "s-private-backend/rss/failure-reporter";
import { afterEach, expect, test, vi } from "vitest";
afterEach(() => vi.restoreAllMocks());
test("writes matching bounded diagnostics to Vercel and Sentry, then flushes before returning", async () => {
	const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	const captureException = vi.fn();
	const flush = vi.fn().mockResolvedValue(true);
	const failure = {
		feedId: "feed",
		hostname: "example.com",
		stage: "http" as const,
		reason: "http_status" as const,
		httpStatus: 403,
		durationMs: 42,
	};
	await createRssFailureReporter({ captureException }, flush)(failure);
	expect(consoleError).toHaveBeenCalledWith(
		"RSS refresh failed",
		expect.objectContaining({ source: "rss_refresh", ...failure }),
	);
	expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
		tags: {
			source: "rss_refresh",
			"rss.stage": "http",
			"rss.reason": "http_status",
		},
		extra: expect.objectContaining(failure),
	});
	expect(captureException.mock.calls[0][0].message).toBe(
		"RSS refresh failed: http/http_status",
	);
	expect(flush).toHaveBeenCalledOnce();
	expect(captureException.mock.invocationCallOrder[0]).toBeLessThan(
		flush.mock.invocationCallOrder[0],
	);
});
test("keeps console diagnostics and returns normally if Sentry throws or flush rejects", async () => {
	const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	const captureException = vi.fn().mockImplementationOnce(() => {
		throw new Error("Sentry offline");
	});
	const flush = vi.fn().mockRejectedValue(new Error("flush failed"));
	const report = createRssFailureReporter({ captureException }, flush);
	const failure = {
		feedId: "feed",
		stage: "claim" as const,
		reason: "storage_error" as const,
		durationMs: 1,
	};
	await expect(report(failure)).resolves.toBeUndefined();
	await expect(report(failure)).resolves.toBeUndefined();
	expect(consoleError).toHaveBeenCalledTimes(2);
});
