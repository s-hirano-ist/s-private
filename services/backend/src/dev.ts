import { serve } from "@hono/node-server";
import { loadBackendEnv } from "s-private-backend/env";
import app from "s-private-backend/index";

serve({
	fetch: app.fetch,
	port: loadBackendEnv().BACKEND_PORT,
	hostname: "127.0.0.1",
});
