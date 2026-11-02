import { withTransactionRetry } from "@s-hirano-ist/s-database";
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
test("does not retry validation errors or loop through a cyclic cause", async () => {
	const error = new Error("validation");
	error.cause = error;
	const work = vi.fn().mockRejectedValue(error);
	await expect(withTransactionRetry(work, { baseDelayMs: 0 })).rejects.toBe(
		error,
	);
	expect(work).toHaveBeenCalledOnce();
});
