import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { createPushSubscriptionRepository } from "@s-hirano-ist/s-infrastructure/notifications/prisma-push-subscription-repository";
import { expect, test, vi } from "vitest";
function fixture() {
	const pushSubscription = {
		findUnique: vi.fn().mockResolvedValue(null),
		updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		upsert: vi.fn(),
		findMany: vi.fn(),
	};
	const transaction = vi.fn(async (work: (tx: unknown) => Promise<void>) =>
		work({ pushSubscription }),
	);
	const db = {
		$transaction: transaction,
		pushSubscription,
	} as unknown as DatabaseClient;
	return {
		pushSubscription,
		transaction,
		repository: createPushSubscriptionRepository(db),
	};
}
test("only targets active snapshots and reports whether the atomic update happened", async () => {
	const { pushSubscription, repository } = fixture();
	const time = new Date();
	await repository.listAll();
	expect(pushSubscription.findMany).toHaveBeenCalledWith({
		where: { requiresResubscribe: false },
	});
	expect(await repository.markRequiresResubscribe("id", time)).toBe(true);
	expect(pushSubscription.updateMany).toHaveBeenCalledWith({
		where: { id: "id", updatedAt: time, requiresResubscribe: false },
		data: { requiresResubscribe: true },
	});
	pushSubscription.updateMany.mockResolvedValue({ count: 0 });
	expect(await repository.markRequiresResubscribe("id", time)).toBe(false);
});
test.each([0, 1])(
	"rejects a foreign new or replacement endpoint inside the transaction (%s)",
	async (foreignIndex) => {
		const { pushSubscription, transaction, repository } = fixture();
		const values: ({ userId: string } | null)[] = [null, null];
		values[foreignIndex] = { userId: "foreign" };
		pushSubscription.findUnique
			.mockResolvedValueOnce(values[0])
			.mockResolvedValueOnce(values[1]);
		await expect(
			repository.save(
				"owner",
				"https://push.example/new",
				"auth",
				"key",
				"https://push.example/old",
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(transaction).toHaveBeenCalledTimes(1);
		expect(pushSubscription.upsert).not.toHaveBeenCalled();
		expect(pushSubscription.updateMany).not.toHaveBeenCalled();
	},
);
test("replacement pauses the old endpoint and clears the saved endpoint in one transaction", async () => {
	const { pushSubscription, transaction, repository } = fixture();
	await repository.save(
		"owner",
		"https://push.example/new",
		"auth",
		"key",
		"https://push.example/old",
	);
	expect(transaction).toHaveBeenCalledTimes(1);
	expect(pushSubscription.updateMany).toHaveBeenCalledWith({
		where: { endpoint: "https://push.example/old", userId: "owner" },
		data: { requiresResubscribe: true },
	});
	expect(pushSubscription.upsert).toHaveBeenCalledWith(
		expect.objectContaining({
			where: { endpoint: "https://push.example/new", userId: "owner" },
			update: { auth: "auth", p256dh: "key", requiresResubscribe: false },
		}),
	);
});
