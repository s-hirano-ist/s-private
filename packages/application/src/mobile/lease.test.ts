import {
	leaseRenewalMs,
	withLease,
} from "@s-hirano-ist/s-application/mobile/lease";
import { afterEach, expect, test, vi } from "vitest";
afterEach(() => vi.useRealTimers());
async function failedRenewal(renew: () => Promise<boolean>) {
	vi.useFakeTimers();
	let finish!: () => void;
	const gate = new Promise<void>((resolve) => {
		finish = resolve;
	});
	const task = withLease(renew, async (assertHeld) => {
		await gate;
		assertHeld();
	});
	const observed = task.catch((error: unknown) => error);
	await vi.advanceTimersByTimeAsync(leaseRenewalMs);
	finish();
	expect(await observed).toMatchObject({ code: "OPERATION_IN_PROGRESS" });
	await vi.advanceTimersByTimeAsync(leaseRenewalMs * 2);
}
test("fences a worker when renewal is refused", async () => {
	const renew = vi.fn(async () => false);
	await failedRenewal(renew);
	expect(renew).toHaveBeenCalledOnce();
});
test("fences a worker when renewal fails", async () => {
	const renew = vi.fn(async () => {
		throw new Error("unavailable");
	});
	await failedRenewal(renew);
	expect(renew).toHaveBeenCalledOnce();
});
