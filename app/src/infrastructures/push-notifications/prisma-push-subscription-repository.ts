import prisma from "@/prisma";
import { createPushSubscriptionRepository } from "@s-hirano-ist/s-backend/notifications/prisma-push-subscription-repository";
export const prismaPushSubscriptionRepository =
	createPushSubscriptionRepository(prisma);
