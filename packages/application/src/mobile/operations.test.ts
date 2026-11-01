import type { MobileOperationRepository } from "@s-hirano-ist/s-application/mobile/ports";
import { runMobileOperation } from "@s-hirano-ist/s-application/mobile/operations";
import { expect, test, vi } from "vitest";

function fixture() {
	let inTransaction = false;
	const order: string[] = [];
	const operations: MobileOperationRepository = {
		findOperation: vi.fn(async () => null),
		claimOperation: vi.fn(async () => ({ token: "lease" })),
		renewOperation: vi.fn(async () => true),
		markOperationFailed: vi.fn(async () => {
			order.push("failed");
		}),
		markOperationSucceeded: vi.fn(async () => {
			expect(inTransaction).toBe(true);
			order.push("success");
		}),
	};
	const transactions = {
		async run<T>(work: () => Promise<T>) {
			inTransaction = true;
			try {
				const result = await work();
				order.push("commit");
				return result;
			} finally {
				inTransaction = false;
			}
		},
	};
	return {
		operations,
		transactions,
		order,
		isInTransaction: () => inTransaction,
	};
}
test("persists the content and success together before delivering events", async () => {
	const deps = fixture();
	const result = await runMobileOperation(
		"owner",
		"notes",
		"operation",
		{},
		async (commit) => {
			const id = await commit(async () => {
				expect(deps.isInTransaction()).toBe(true);
				deps.order.push("content");
				return "note";
			});
			expect(deps.isInTransaction()).toBe(false);
			deps.order.push("event");
			return id;
		},
		deps,
	);
	expect(result.resource.id).toBe("note");
	expect(deps.order).toEqual(["content", "success", "commit", "event"]);
});
test("does not record success when persistence fails", async () => {
	const deps = fixture();
	await expect(
		runMobileOperation(
			"owner",
			"notes",
			"operation",
			{},
			(commit) =>
				commit(async () => {
					throw new Error("database");
				}),
			deps,
		),
	).rejects.toThrow("database");
	expect(deps.operations.markOperationSucceeded).not.toHaveBeenCalled();
	expect(deps.order).toEqual(["failed"]);
});
