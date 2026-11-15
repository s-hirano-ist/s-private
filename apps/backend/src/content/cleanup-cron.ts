/** Internal cron uses the same secret and enablement as the existing notification job. */
export function createMediaCleanupCron(
	config: { BACKEND_CRON_ENABLED: boolean; CRON_SECRET?: string },
	drain: () => Promise<{ processed: number }>,
) {
	return async (request: Request): Promise<Response> => {
		if (!config.BACKEND_CRON_ENABLED)
			return new Response(null, { status: 404 });
		if (
			!config.CRON_SECRET ||
			request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`
		)
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		return Response.json(await drain());
	};
}
