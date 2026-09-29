// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { env } from "@/env";
import { init } from "@sentry/nextjs";
import { scan } from "react-scan";

if (process.env.NODE_ENV === "development") {
	scan({ enabled: true });
}

init({
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	environment: process.env.NODE_ENV,
	integrations: [],
	tracesSampleRate: 1.0,
	debug: false,
});

export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
