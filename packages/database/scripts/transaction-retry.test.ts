import { Prisma, withTransactionRetry } from "@s-hirano-ist/s-database";
import { expect, test, vi } from "vitest";

test.each(["40001", "P2034"])(
	"retries a serialization conflict wrapped by diagnostics (%s)",
	async (code) => {
		const conflict = Object.assign(new Error("conflict"), { code });
		const wrapped = new Error("create-record", {
			cause: new Error("phase", { cause: conflict }),
		});
		const work = vi
			.fn()
			.mockRejectedValueOnce(wrapped)
			.mockResolvedValue("committed");
		expect(await withTransactionRetry(work, { baseDelayMs: 0 })).toBe(
			"committed",
		);
		expect(work).toHaveBeenCalledTimes(2);
	},
);
test("preserves the original diagnostic error after retry exhaustion", async () => {
	const wrapped = new Error("phase", { cause: { code: "P2034" } });
	const work = vi.fn().mockRejectedValue(wrapped);
	await expect(
		withTransactionRetry(work, { maxRetries: 1, baseDelayMs: 0 }),
	).rejects.toBe(wrapped);
	expect(work).toHaveBeenCalledTimes(2);
});
test("retries a wrapped transaction acquisition timeout", async () => {
	const timeout = new Prisma.PrismaClientKnownRequestError(
		"Invalid `prisma.book.updateMany()` invocation:\nTransaction API error: Unable to start a transaction in the given time.",
		{ code: "P2028", clientVersion: Prisma.prismaVersion.client },
	);
	const work = vi
		.fn()
		.mockRejectedValueOnce(new Error("reset-books", { cause: timeout }))
		.mockResolvedValue("committed");
	expect(await withTransactionRetry(work, { baseDelayMs: 0 })).toBe(
		"committed",
	);
	expect(work).toHaveBeenCalledTimes(2);
});
test("stops retrying acquisition timeouts after the configured limit", async () => {
	const timeout = new Prisma.PrismaClientKnownRequestError(
		"Transaction API error: Unable to start a transaction in the given time.",
		{ code: "P2028", clientVersion: Prisma.prismaVersion.client },
	);
	const work = vi.fn().mockRejectedValue(timeout);
	await expect(
		withTransactionRetry(work, { maxRetries: 2, baseDelayMs: 0 }),
	).rejects.toBe(timeout);
	expect(work).toHaveBeenCalledTimes(3);
});
test.each([
	"Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction.",
	"Transaction API error: Transaction already closed: A commit cannot be executed on a committed transaction.",
	"Transaction API error: Unable to commit transaction.",
	"Transaction API error: Unknown transaction error.",
])("does not retry other P2028 failures: %s", async (message) => {
	const error = new Prisma.PrismaClientKnownRequestError(message, {
		code: "P2028",
		clientVersion: Prisma.prismaVersion.client,
	});
	const work = vi.fn().mockRejectedValue(error);
	await expect(withTransactionRetry(work, { baseDelayMs: 0 })).rejects.toBe(
		error,
	);
	expect(work).toHaveBeenCalledOnce();
});
test("does not retry validation errors or loop through a cyclic cause", async () => {
	const error = new Error("validation");
	error.cause = error;
	const work = vi.fn().mockRejectedValue(error);
	await expect(withTransactionRetry(work, { baseDelayMs: 0 })).rejects.toBe(
		error,
	);
	expect(work).toHaveBeenCalledOnce();
});

test("recovered retries report a bounded outcome without reporting the intermediate error", async () => {
	const onComplete = vi.fn();
	const work = vi
		.fn()
		.mockRejectedValueOnce({ code: "P2034" })
		.mockResolvedValue("ok");
	expect(await withTransactionRetry(work, { baseDelayMs: 0, onComplete })).toBe(
		"ok",
	);
	expect(onComplete).toHaveBeenCalledExactlyOnceWith({
		retries: 1,
		durationMs: expect.any(Number),
		outcome: "recovered",
	});
});

test("retry exhaustion reports failure once and preserves the final error", async () => {
	const error = { code: "40001" };
	const onComplete = vi.fn();
	await expect(
		withTransactionRetry(vi.fn().mockRejectedValue(error), {
			maxRetries: 2,
			baseDelayMs: 0,
			onComplete,
		}),
	).rejects.toBe(error);
	expect(onComplete).toHaveBeenCalledExactlyOnceWith({
		retries: 2,
		durationMs: expect.any(Number),
		outcome: "failed",
	});
});

test("retry telemetry failure cannot replay an already committed operation", async () => {
	const work = vi
		.fn()
		.mockRejectedValueOnce({ code: "40001" })
		.mockResolvedValue("committed");
	expect(
		await withTransactionRetry(work, {
			baseDelayMs: 0,
			onComplete: () => {
				throw new Error("telemetry unavailable");
			},
		}),
	).toBe("committed");
	expect(work).toHaveBeenCalledTimes(2);
});

test("jitter retains a delay between half and all of the exponential bound", async () => {
	vi.useFakeTimers();
	const random = vi.spyOn(Math, "random").mockReturnValue(0);
	try {
		const work = vi
			.fn()
			.mockRejectedValueOnce({ code: "40001" })
			.mockResolvedValue("ok");
		const result = withTransactionRetry(work, { baseDelayMs: 100 });
		await vi.advanceTimersByTimeAsync(49);
		expect(work).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(await result).toBe("ok");
		expect(work).toHaveBeenCalledTimes(2);
	} finally {
		random.mockRestore();
		vi.useRealTimers();
	}
});
