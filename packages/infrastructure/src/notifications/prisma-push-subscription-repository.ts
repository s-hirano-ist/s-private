import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import { withPersistenceErrors } from "@s-hirano-ist/s-infrastructure/persistence-errors";
import { randomUUID } from "node:crypto";

export function createPushSubscriptionRepository(
	prisma: DatabaseClient,
): PushSubscriptionRepository {
	return {
		findByEndpoint(endpoint) {
			return prisma.pushSubscription.findUnique({ where: { endpoint } });
		},
		findOwned(userId, endpoint) {
			return prisma.pushSubscription.findFirst({ where: { endpoint, userId } });
		},
		listAll() {
			return prisma.pushSubscription.findMany({
				where: { requiresResubscribe: false },
			});
		},
		async save(userId, endpoint, auth, p256dh, replacesEndpoint) {
			await withPersistenceErrors(async () => {
				await prisma.$transaction(async (tx) => {
					const current = await tx.pushSubscription.findUnique({
						where: { endpoint },
					});
					if (current && current.userId !== userId)
						throw new PushSubscriptionError(
							"FORBIDDEN",
							"Subscription belongs to another user",
						);
					if (replacesEndpoint && replacesEndpoint !== endpoint) {
						const previous = await tx.pushSubscription.findUnique({
							where: { endpoint: replacesEndpoint },
						});
						if (previous && previous.userId !== userId)
							throw new PushSubscriptionError(
								"FORBIDDEN",
								"Subscription belongs to another user",
							);
						await tx.pushSubscription.updateMany({
							where: { endpoint: replacesEndpoint, userId },
							data: { requiresResubscribe: true },
						});
					}
					await tx.pushSubscription.upsert({
						where: { endpoint, userId },
						create: { id: randomUUID(), userId, endpoint, auth, p256dh },
						update: { auth, p256dh, requiresResubscribe: false },
					});
				});
			}, "FORBIDDEN");
		},
		async markRequiresResubscribe(id, updatedAt) {
			const result = await prisma.pushSubscription.updateMany({
				where: { id, updatedAt, requiresResubscribe: false },
				data: { requiresResubscribe: true },
			});
			return result.count === 1;
		},
		async deleteOwned(userId, endpoint) {
			await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
		},
		async deleteByIds(ids) {
			await prisma.pushSubscription.deleteMany({ where: { id: { in: ids } } });
		},
	};
}
