import type { createPushDeliveryService } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import { buildGigazineHeadline } from "@s-hirano-ist/s-backend/notifications/gigazine-headline";
export function createGigazineCronHandler(
	config: { CRON_SECRET?: string },
	sendPushToAll: ReturnType<typeof createPushDeliveryService>["sendPushToAll"],
) {
	return async function GET(request: Request): Promise<Response> {
		if (
			!config.CRON_SECRET ||
			request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`
		)
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		const { date, payload } = buildGigazineHeadline();
		const summary = await sendPushToAll(payload);
		return Response.json(
			{ date, ...summary },
			{ status: summary.failed > 0 ? 500 : 200 },
		);
	};
}
