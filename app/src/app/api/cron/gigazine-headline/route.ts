import { sendPushToAll } from "@/application-services/push-notifications/push-notification-service";
import { env } from "@/env";
import { createGigazineCronHandler } from "@s-hirano-ist/s-backend/notifications/cron";
export const GET = createGigazineCronHandler(env, sendPushToAll);
