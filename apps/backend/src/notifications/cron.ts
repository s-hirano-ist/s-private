import type { SendPushToAll } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { buildGigazineHeadline } from "@s-hirano-ist/s-application/notifications/gigazine-headline";
export function createGigazineCronHandler(
	config: { CRON_SECRET?: string },
	sendPushToAll: SendPushToAll,
	reportCritical: (error: unknown) => unknown,
) {
	return async function GET(request: Request): Promise<Response> {
		if (
			!config.CRON_SECRET ||
			request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`
		)
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		const { date, payload } = buildGigazineHeadline();
		let summary;
		try {
			summary = await sendPushToAll(payload);
		} catch (error) {
			await reportCritical(error);
			return Response.json({ error: "Batch failed" }, { status: 500 });
		}
		if (summary.failed > 0 && summary.sent === 0) {
			await reportCritical(
				new Error("Gigazine batch failed: no notifications delivered"),
			);
		}
		return Response.json(
			{ date, ...summary },
			{ status: summary.failed > 0 ? 500 : 200 },
		);
	};
}
