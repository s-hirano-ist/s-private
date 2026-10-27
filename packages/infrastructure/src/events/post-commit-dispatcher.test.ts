import { createPostCommitDispatcher } from "@s-hirano-ist/s-infrastructure/events/post-commit-dispatcher";
import { expect, test, vi } from "vitest";

test("reports failed delivery without rejecting a committed result, even when reporting fails", async () => {
	const error = new Error("delivery");
	const dispatcher = { dispatch: vi.fn().mockRejectedValue(error) };
	const reporter = {
		captureException: vi.fn().mockImplementation(() => {
			throw new Error("reporting");
		}),
	};
	await expect(
		createPostCommitDispatcher(dispatcher, reporter).dispatch({
			eventType: "test",
			metadata: { caller: "test", timestamp: new Date(), userId: "owner" },
			payload: {},
		}),
	).resolves.toBeUndefined();
	expect(reporter.captureException).toHaveBeenCalledWith(error, {
		tags: { phase: "post-commit-event" },
	});
});
