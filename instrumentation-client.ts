// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
	captureConsoleIntegration,
	captureRouterTransitionStart,
	init,
	replayIntegration,
} from "@sentry/nextjs";
import { env } from "@/env";

// eslint-disable-next-line
export const onRouterTransitionStart = captureRouterTransitionStart;

init({
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	// enabled: process.env.NODE_ENV === "production",

	// Add optional integrations for additional features
	integrations: [replayIntegration(), captureConsoleIntegration()],

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Define how likely Replay events are sampled.
	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// Define how likely Replay events are sampled when an error occurs.
	replaysOnErrorSampleRate: 1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
});
