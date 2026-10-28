import type { SendPushToAll } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { buildGigazineHeadline } from "@s-hirano-ist/s-application/notifications/gigazine-headline";
export function createGigazineCronHandler(
	config: { CRON_SECRET?: string },
	sendPushToAll: SendPushToAll,
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
