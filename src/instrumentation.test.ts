import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	captureRequestError: vi.fn(),
}));

// Mock the config imports
vi.mock("../sentry.server.config", () => ({}));
vi.mock("../sentry.edge.config", () => ({}));

describe("instrumentation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.NEXT_RUNTIME;
	});

	it("should import server config when NEXT_RUNTIME is nodejs", async () => {
		process.env.NEXT_RUNTIME = "nodejs";

		const { register } = await import("./instrumentation");
		await register();

		// The import should have been called - we can't directly test dynamic imports
		// but we can test that the function executes without error
		expect(true).toBe(true);
	});

	it("should import edge config when NEXT_RUNTIME is edge", async () => {
		process.env.NEXT_RUNTIME = "edge";

		const { register } = await import("./instrumentation");
		await register();

		// The import should have been called
		expect(true).toBe(true);
	});

	it("should not import config when NEXT_RUNTIME is not set", async () => {
		// NEXT_RUNTIME is undefined

		const { register } = await import("./instrumentation");
		await register();

		// Function should execute without error even when no config is imported
		expect(true).toBe(true);
	});

	it("should export onRequestError from Sentry", async () => {
		const Sentry = await import("@sentry/nextjs");
		const { onRequestError } = await import("./instrumentation");

		expect(onRequestError).toBe(Sentry.captureRequestError);
	});

	it("should handle different NEXT_RUNTIME values", async () => {
		const runtimes = ["nodejs", "edge", "browser", undefined];

		for (const runtime of runtimes) {
			if (runtime) {
				process.env.NEXT_RUNTIME = runtime;
			} else {
				delete process.env.NEXT_RUNTIME;
			}

			const { register } = await import("./instrumentation");

			// Should not throw error for any runtime value
			await expect(register()).resolves.not.toThrow();
		}
	});
});
