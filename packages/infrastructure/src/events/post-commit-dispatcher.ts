import type { EventDispatcher } from "@s-hirano-ist/s-application/events/ports";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";

/** Delivery and diagnostics cannot reverse a committed mutation. */
export function createPostCommitDispatcher(
	dispatcher: EventDispatcher,
	reporter: Pick<ErrorReporter, "captureException">,
): EventDispatcher {
	return {
		async dispatch(event) {
			try {
				await dispatcher.dispatch(event);
			} catch (error) {
				try {
					reporter.captureException(error, {
						tags: { phase: "post-commit-event" },
					});
				} catch {
					/* Reporting cannot change committed results. */
				}
			}
		},
	};
}
