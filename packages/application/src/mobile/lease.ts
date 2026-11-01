import { ApplicationError } from "@s-hirano-ist/s-application/error";
export const leaseDurationMs = 10 * 60 * 1000;
export const leaseRenewalMs = 60 * 1000;

/** Renewal errors fence off the worker; the DB token check remains authoritative. */
export async function withLease<T>(
	renew: () => Promise<boolean>,
	work: (assertHeld: () => void) => Promise<T>,
): Promise<T> {
	let lost = false;
	let pending = Promise.resolve(true);
	const timer = setInterval(() => {
		pending = pending.then(async () => {
			try {
				const renewed = await renew();
				if (!renewed) lost = true;
				return renewed;
			} catch {
				lost = true;
				return false;
			}
		});
	}, leaseRenewalMs);
	timer.unref();
	try {
		return await work(() => {
			if (lost) throw new ApplicationError("OPERATION_IN_PROGRESS");
		});
	} finally {
		clearInterval(timer);
		await pending;
	}
}
