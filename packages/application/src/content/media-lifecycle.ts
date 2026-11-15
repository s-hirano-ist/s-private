import type { Transaction } from "@s-hirano-ist/s-application/transaction";

export type MediaDomain = "images" | "books";
/** Serialize the complete upload + DB commit with deletion for the same object. */
export type MediaLock = {
	run<T>(
		domain: MediaDomain,
		path: string,
		work: (assertActive: () => Promise<void>) => Promise<T>,
	): Promise<T>;
};
export type MediaDeletionQueue = {
	/** Must be called inside the content deletion transaction. */
	enqueue(domain: MediaDomain, owner: string, path: string): Promise<string>;
	/** Best effort after commit; failures remain durable for the worker. */
	process(id: string): Promise<void>;
};
export type MediaDeletionDeps = {
	deletionQueue: MediaDeletionQueue;
	transactions: Transaction;
};
