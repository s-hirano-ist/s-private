import { Hono } from "hono";
import { loadBackendEnv } from "s-private-backend/env";
import { createBackendRuntime } from "s-private-backend/runtime";

const runtime = createBackendRuntime(loadBackendEnv());
const app = new Hono().route("/", runtime.app);
export default app;
