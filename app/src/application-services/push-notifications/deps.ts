import type { PushSubscriptionRepository } from "@/application-services/push-notifications/ports";
import { prismaPushSubscriptionRepository } from "@/infrastructures/push-notifications/prisma-push-subscription-repository";

export const pushSubscriptionRepository: PushSubscriptionRepository =
	prismaPushSubscriptionRepository;
