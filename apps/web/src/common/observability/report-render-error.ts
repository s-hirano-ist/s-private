import { captureException } from "@sentry/nextjs";

/** Web rendering failures use Web monitoring; domain notifications belong to the backend. */
export function reportRenderError(error: unknown, caller: string): void {
	captureException(error, { tags: { caller, layer: "web-render" } });
}
