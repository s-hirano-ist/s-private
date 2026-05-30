// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { env } from "@/env";
import { init } from "@sentry/nextjs";

init({
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	integrations: [],
	tracesSampleRate: 0.2,
	debug: false,
});

export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
