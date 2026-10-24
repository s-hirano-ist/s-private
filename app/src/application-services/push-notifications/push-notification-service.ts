import { pushSubscriptionRepository } from "@/application-services/push-notifications/deps";
import { env } from "@/env";
import { createPushDeliveryService } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import * as Sentry from "@sentry/nextjs";
export const { sendPushToAll, sendPushToSubscription } =
	createPushDeliveryService(env, pushSubscriptionRepository, Sentry);
