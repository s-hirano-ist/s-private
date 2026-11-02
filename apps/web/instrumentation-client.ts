// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
	sentryPrivacyOptions,
	resolveTraceSampleRate,
} from "@/common/observability/sentry-options";
import { env } from "@/env";
import {
	browserTracingIntegration,
	init,
	replayIntegration,
} from "@sentry/nextjs";

if (process.env.NODE_ENV === "development") {
	void import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

init({
	...sentryPrivacyOptions,
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	enabled:
		process.env.NODE_ENV === "production" && !!env.NEXT_PUBLIC_SENTRY_DSN,
	environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
	release: env.NEXT_PUBLIC_SENTRY_RELEASE,
	integrations: [
		// Also installs WebVitals (LCP/CLS/INP, FCP/TTFB), resource and request timing.
		browserTracingIntegration({ enableLongAnimationFrame: true }),
		replayIntegration({
			maskAllText: true,
			maskAllInputs: true,
			blockAllMedia: true,
			maskAttributes: [
				"title",
				"alt",
				"placeholder",
				"aria-label",
				"href",
				"src",
			],
			networkDetailAllowUrls: [],
			networkCaptureBodies: false,
			// Replay has its own console/network breadcrumbs, separate from beforeBreadcrumb.
			beforeAddRecordingEvent(event) {
				if (event.data.tag !== "options") return null;
				return event;
			},
		}),
	],
	// SDK defaults propagate only to same-origin requests, including Server Actions.
	tracesSampleRate: resolveTraceSampleRate(
		env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
	),
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate:
		env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 0,
	debug: false,
});

export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
