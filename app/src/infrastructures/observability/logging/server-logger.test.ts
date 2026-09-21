import type { LogContext } from "./logger.interface";
import type { NotificationService } from "@s-hirano-ist/s-notification";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ServerLogger } from "./server-logger";

const { captureException, captureMessage } = vi.hoisted(() => ({
	captureException: vi.fn(),
	captureMessage: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ captureException, captureMessage }));

describe("ServerLogger", () => {
	const notificationService: NotificationService = {
		notifyError: vi.fn().mockResolvedValue(undefined),
		notifyInfo: vi.fn().mockResolvedValue(undefined),
		notifyWarning: vi.fn().mockResolvedValue(undefined),
	};
	const context: LogContext = {
		caller: "testCaller",
		status: 500,
		userId: "user-123",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("captures Error instances with diagnostic context", async () => {
		const error = new TypeError("database failed");
		const logger = new ServerLogger(notificationService);

		await logger.error("Database connection failed", context, error);

		expect(captureException).toHaveBeenCalledWith(error, {
			extra: { additionalContext: undefined, originalError: undefined },
			tags: {
				caller: "testCaller",
				error_type: "TypeError",
				status: "500",
			},
			user: { id: "user-123" },
		});
		expect(captureMessage).not.toHaveBeenCalled();
	});

	test("captures an error message when no Error object is available", async () => {
		const logger = new ServerLogger(notificationService);

		await logger.error("Unknown failure", context, { requestId: "request-1" });

		expect(captureMessage).toHaveBeenCalledWith("Unknown failure", {
			extra: {
				additionalContext: undefined,
				originalError: { requestId: "request-1" },
			},
			level: "error",
			tags: {
				caller: "testCaller",
				error_type: "message",
				status: "500",
			},
			user: { id: "user-123" },
		});
	});

	test("does not create a Sentry issue for warnings", async () => {
		const logger = new ServerLogger(notificationService);

		await logger.warn("Expected validation warning", context);

		expect(captureException).not.toHaveBeenCalled();
		expect(captureMessage).not.toHaveBeenCalled();
	});

	test("captures Pushover delivery failures without failing the caller", async () => {
		const notificationError = new Error("Pushover unavailable");
		const failingNotificationService: NotificationService = {
			notifyError: vi.fn().mockRejectedValue(notificationError),
			notifyInfo: vi.fn().mockResolvedValue(undefined),
			notifyWarning: vi.fn().mockResolvedValue(undefined),
		};
		const logger = new ServerLogger(failingNotificationService);

		await expect(
			logger.error("Critical failure", context, undefined, { notify: true }),
		).resolves.toBeUndefined();

		expect(captureException).toHaveBeenCalledWith(notificationError, {
			tags: {
				caller: "testCaller",
				error_type: "notification_delivery",
				status: "500",
			},
			user: { id: "user-123" },
		});
	});
});
