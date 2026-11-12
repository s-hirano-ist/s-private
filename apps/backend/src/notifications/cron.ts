import type { SendPushToAll } from "@s-hirano-ist/s-application/notifications/delivery-port";
import type { OperationalTelemetry } from "@s-hirano-ist/s-infrastructure/observability/operational-telemetry";
import type * as Sentry from "@sentry/node";
import { buildGigazineHeadline } from "@s-hirano-ist/s-application/notifications/gigazine-headline";
import { observe } from "@s-hirano-ist/s-infrastructure/observability/operational-telemetry";
export function createGigazineCronHandler(
	config: { CRON_SECRET?: string },
	sendPushToAll: SendPushToAll,
	reportCritical: (error: unknown) => unknown,
	monitoring?: {
		captureCheckIn: typeof Sentry.captureCheckIn;
		enabled: boolean;
		flush: () => Promise<boolean>;
		telemetry: OperationalTelemetry;
	},
) {
	return async function GET(request: Request): Promise<Response> {
		if (
			!config.CRON_SECRET ||
			request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`
		)
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		let checkInId: string | undefined;
		const finish = async (status: "ok" | "error") => {
			if (!monitoring?.enabled) return;
			observe(() =>
				monitoring.captureCheckIn({
					checkInId,
					monitorSlug: "gigazine-headline",
					status,
				}),
			);
			try {
				await monitoring.flush();
			} catch {
				/* A monitoring failure must not fail the job. */
			}
		};
		if (monitoring?.enabled)
			observe(() => {
				checkInId = monitoring.captureCheckIn(
					{ monitorSlug: "gigazine-headline", status: "in_progress" },
					{
						schedule: { type: "crontab", value: "0 0 * * *" },
						timezone: "UTC",
						checkinMargin: 60,
						maxRuntime: 10,
					},
				);
			});
		const { date, payload } = buildGigazineHeadline();
		let summary;
		try {
			summary = await sendPushToAll(payload);
		} catch (error) {
			await reportCritical(error);
			await finish("error");
			return Response.json({ error: "Batch failed" }, { status: 500 });
		}
		if (summary.failed > 0 && summary.sent === 0) {
			await reportCritical(
				new Error("Gigazine batch failed: no notifications delivered"),
			);
		}
		if (monitoring?.enabled) {
			monitoring.telemetry.count("cron.deliveries", summary.sent, {
				job: "gigazine-headline",
				status: "sent",
			});
			monitoring.telemetry.count("cron.deliveries", summary.failed, {
				job: "gigazine-headline",
				status: "failed",
			});
		}
		await finish(summary.failed > 0 ? "error" : "ok");
		return Response.json(
			{ date, ...summary },
			{ status: summary.failed > 0 ? 500 : 200 },
		);
	};
}
