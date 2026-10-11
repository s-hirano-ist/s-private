import type { PushSubscriptionRepository } from "@s-hirano-ist/s-backend/notifications/ports";
import type { DatabaseClient } from "@s-hirano-ist/s-backend/shared/database";
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
			return prisma.pushSubscription.findMany();
		},
		async save(userId, endpoint, auth, p256dh) {
			await prisma.pushSubscription.upsert({
				where: { endpoint, userId },
				create: { id: randomUUID(), userId, endpoint, auth, p256dh },
				update: { auth, p256dh },
			});
		},
		async deleteOwned(userId, endpoint) {
			await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
		},
		async deleteByIds(ids) {
			await prisma.pushSubscription.deleteMany({ where: { id: { in: ids } } });
		},
	};
}
