import { buildGigazineHeadline } from "@/application-services/push-notifications/gigazine-headline";
import { sendPushToAll } from "@/application-services/push-notifications/push-notification-service";
import { env } from "@/env";

export async function GET(request: Request): Promise<Response> {
	if (
		!env.CRON_SECRET ||
		request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
	) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { date, payload } = buildGigazineHeadline();
	const summary = await sendPushToAll(payload);
	return Response.json(
		{ date, ...summary },
		{ status: summary.failed > 0 ? 500 : 200 },
	);
}
