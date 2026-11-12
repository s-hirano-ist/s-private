import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

const sentry = vi.hoisted(() => ({
	init: vi.fn(),
	captureException: vi.fn(),
	captureMessage: vi.fn(),
	flush: vi.fn(),
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
	metrics: { count: vi.fn(), distribution: vi.fn() },
}));
const notifications = vi.hoisted(() => ({
	notifyInfo: vi.fn(),
	notifyError: vi.fn(),
	notifyWarning: vi.fn(),
}));
vi.mock("@sentry/node", () => sentry);
vi.mock("@s-hirano-ist/s-notification", () => ({
	createPushoverService: () => notifications,
}));

beforeEach(() => {
	vi.resetModules();
	vi.resetAllMocks();
	vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@example.com/1");
	vi.stubEnv("DATABASE_URL", "postgresql://user:secret@example.com/private");
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	sentry.flush.mockResolvedValue(true);
	notifications.notifyInfo.mockResolvedValue(undefined);
	notifications.notifyError.mockResolvedValue(undefined);
	process.exitCode = undefined;
});
afterEach(() => {
	process.exitCode = undefined;
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

test("whole command failures are sanitized, recorded before paging and flushed after cleanup", async () => {
	const { runCli } = await import("./cli-observability.js");
	const cleanup = vi.fn();
	await runCli("fetch-notes", async () => {
		try {
			throw new Error(`DB failed ${process.env.DATABASE_URL}`);
		} finally {
			cleanup();
		}
	});
	expect(cleanup).toHaveBeenCalledOnce();
	expect(process.exitCode).toBe(1);
	expect(sentry.captureException).toHaveBeenCalledOnce();
	expect(sentry.captureException.mock.calls[0][0].message).toBe(
		"DB failed [REDACTED]",
	);
	expect(notifications.notifyError).toHaveBeenCalledExactlyOnceWith(
		"fetch-notes failed",
		{ caller: "fetch-notes", userId: undefined },
	);
	expect(sentry.captureException.mock.invocationCallOrder[0]).toBeLessThan(
		notifications.notifyError.mock.invocationCallOrder[0],
	);
	expect(sentry.flush).toHaveBeenCalledExactlyOnceWith(2000);
});

test("item failures record to Sentry without paging or failing the command", async () => {
	const { runCli, reportCliError } = await import("./cli-observability.js");
	await runCli("enrich-books", async () => {
		reportCliError(new Error("one item failed"), "enrich-books");
	});
	expect(sentry.captureException).toHaveBeenCalledOnce();
	expect(notifications.notifyError).not.toHaveBeenCalled();
	expect(process.exitCode).toBeUndefined();
});

test("completion failures are recorded without changing a successful exit", async () => {
	const { runCli, cliNotifications } = await import("./cli-observability.js");
	notifications.notifyInfo.mockRejectedValue(new Error("delivery failed"));
	await runCli("fetch-books", () =>
		cliNotifications.notifyInfo("fetch-books completed", {
			caller: "fetch-books",
		}),
	);
	expect(sentry.captureException).toHaveBeenCalledOnce();
	expect(notifications.notifyError).not.toHaveBeenCalled();
	expect(process.exitCode).toBeUndefined();
});

test("successful completion only sends Pushover", async () => {
	const { runCli, cliNotifications } = await import("./cli-observability.js");
	await runCli("fetch-books", () =>
		cliNotifications.notifyInfo("fetch-books completed", {
			caller: "fetch-books",
		}),
	);
	expect(notifications.notifyInfo).toHaveBeenCalledOnce();
	expect(sentry.captureException).not.toHaveBeenCalled();
	expect(sentry.captureMessage).not.toHaveBeenCalled();
});

test("dry-run errors retain exit status without external reporting", async () => {
	const argv = process.argv;
	process.argv = [...argv, "--dry-run"];
	try {
		const { runCli, cliNotifications, reportCliError } =
			await import("./cli-observability.js");
		await runCli("ingest-notes", async () => {
			reportCliError(new Error("item failed"), "ingest-notes");
			await cliNotifications.notifyInfo("completed", {
				caller: "ingest-notes",
			});
			throw new Error("failed");
		});
		expect(process.exitCode).toBe(1);
		expect(sentry.init).not.toHaveBeenCalled();
		expect(sentry.captureException).not.toHaveBeenCalled();
		expect(sentry.flush).not.toHaveBeenCalled();
		expect(notifications.notifyInfo).not.toHaveBeenCalled();
		expect(notifications.notifyError).not.toHaveBeenCalled();
	} finally {
		process.argv = argv;
	}
});

test("Sentry and Pushover failures do not recurse or mask the command result", async () => {
	const { runCli } = await import("./cli-observability.js");
	sentry.captureException.mockImplementation(() => {
		throw new Error("Sentry down");
	});
	sentry.flush.mockRejectedValue(new Error("flush failed"));
	notifications.notifyError.mockRejectedValue(new Error("Pushover down"));
	await expect(
		runCli("reset-notes", async () => {
			throw new Error("DB down");
		}),
	).resolves.toBeUndefined();
	expect(notifications.notifyError).toHaveBeenCalledOnce();
	expect(sentry.captureException).toHaveBeenCalledTimes(2);
	expect(process.exitCode).toBe(1);
});

test("cleanup failures reach the critical boundary", async () => {
	const { runCli } = await import("./cli-observability.js");
	const cleanup = vi.fn().mockRejectedValue(new Error("disconnect failed"));
	await runCli("reset-notes", async () => {
		try {
			await Promise.resolve();
		} finally {
			await cleanup();
		}
	});
	expect(notifications.notifyError).toHaveBeenCalledOnce();
	expect(sentry.captureException).toHaveBeenCalledOnce();
	expect(process.exitCode).toBe(1);
});

test("missing DSN warns but allows the command to run", async () => {
	vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
	const { runCli } = await import("./cli-observability.js");
	const execute = vi.fn().mockResolvedValue(undefined);
	await runCli("helper", execute);
	expect(execute).toHaveBeenCalledOnce();
	expect(console.warn).toHaveBeenCalledOnce();
	expect(sentry.init).toHaveBeenCalledWith(
		expect.objectContaining({ enabled: false }),
	);
});

test("monitoring initialization failures do not prevent business execution", async () => {
	const { runCli } = await import("./cli-observability.js");
	sentry.init.mockImplementation(() => {
		throw new Error("monitoring unavailable");
	});
	const execute = vi.fn().mockResolvedValue(undefined);
	await runCli("helper", execute);
	expect(execute).toHaveBeenCalledOnce();
	expect(process.exitCode).toBeUndefined();
	expect(notifications.notifyError).not.toHaveBeenCalled();
});

test("production commands send lifecycle logs and metrics with a bounded job name", async () => {
	vi.stubEnv("NODE_ENV", "production");
	const { runCli } = await import("./cli-observability.js");
	await runCli("fetch-books", async () => {});
	expect(sentry.logger.info).toHaveBeenNthCalledWith(1, "CLI started", {
		job: "fetch-books",
	});
	expect(sentry.logger.info).toHaveBeenNthCalledWith(2, "CLI completed", {
		job: "fetch-books",
		status: "ok",
	});
	expect(sentry.metrics.count).toHaveBeenCalledWith("cli.runs", 1, {
		attributes: { job: "fetch-books", status: "ok" },
	});
	expect(sentry.metrics.distribution).toHaveBeenCalledWith(
		"cli.duration",
		expect.any(Number),
		expect.objectContaining({ unit: "millisecond" }),
	);
});
test("development and dry-run never send operational logs or metrics", async () => {
	vi.stubEnv("NODE_ENV", "development");
	const { runCli } = await import("./cli-observability.js");
	await runCli("fetch-books", async () => {});
	expect(sentry.logger.info).not.toHaveBeenCalled();
	expect(sentry.metrics.count).not.toHaveBeenCalled();
});

test("operational sink failures never change a successful CLI exit", async () => {
	vi.stubEnv("NODE_ENV", "production");
	sentry.logger.info.mockImplementation(() => {
		throw new Error("logs unavailable");
	});
	sentry.metrics.count.mockImplementation(() => {
		throw new Error("metrics unavailable");
	});
	const { runCli } = await import("./cli-observability.js");
	const execute = vi.fn().mockResolvedValue(undefined);
	await runCli("fetch-books", execute);
	expect(execute).toHaveBeenCalledOnce();
	expect(process.exitCode).toBeUndefined();
	expect(notifications.notifyError).not.toHaveBeenCalled();
});

test("production dry-run does not initialize or send operational telemetry", async () => {
	vi.stubEnv("NODE_ENV", "production");
	const argv = process.argv;
	process.argv = [...argv, "--dry-run"];
	try {
		const { runCli } = await import("./cli-observability.js");
		await runCli("fetch-books", async () => {});
		expect(sentry.init).not.toHaveBeenCalled();
		expect(sentry.logger.info).not.toHaveBeenCalled();
		expect(sentry.metrics.count).not.toHaveBeenCalled();
	} finally {
		process.argv = argv;
	}
});
