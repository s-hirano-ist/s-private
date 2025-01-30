import * as Sentry from "@sentry/nextjs";

// MEMO: React server components errors
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
// https://nextjs.org/blog/next-15#instrumentationjs-stable

export const onRequestError = Sentry.captureRequestError;
