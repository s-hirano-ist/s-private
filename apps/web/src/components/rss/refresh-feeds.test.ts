import { refreshFeeds } from "@/components/rss/refresh-feeds";
import { expect, test, vi } from "vite-plus/test";

test("keeps five slots busy without waiting for a slow feed and survives HTTP and feed errors", async () => {
	let release!: () => void;
	const slow = new Promise<void>((resolve) => {
		release = resolve;
	});
	let active = 0;
	let peak = 0;
	const calls: string[] = [];
	const progress = vi.fn();
	const outcome = vi
		.fn(
			async (
				id: string,
			): Promise<{ data: { id: string; status: "updated" | "failed" }[] }> => ({
				data: [{ id, status: "updated" }],
			}),
		)
		.mockImplementationOnce(async (id) => {
			await slow;
			return { data: [{ id, status: "updated" }] };
		})
		.mockRejectedValueOnce(new Error("503"))
		.mockResolvedValueOnce({ data: [{ id: "feed-error", status: "failed" }] });
	const refresh = vi.fn(async ([id]: string[], force: boolean) => {
		expect(force).toBe(true);
		calls.push(id);
		peak = Math.max(peak, ++active);
		try {
			return await outcome(id);
		} finally {
			active--;
		}
	});
	const ids = ["slow", "http-error", "feed-error", "4", "5", "6", "7", "8"];
	const result = refreshFeeds(ids, true, refresh, progress);
	await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(7));
	expect(calls).toEqual(ids);
	expect(peak).toBe(5);
	expect(active).toBe(1);
	expect(progress.mock.calls.filter(([, failed]) => failed)).toHaveLength(2);
	release();
	await result;
	expect(progress).toHaveBeenLastCalledWith(8, false, true);
	expect(refresh.mock.calls.every(([batch]) => batch.length === 1)).toBe(true);
});

test("empty subscriptions do not send requests", async () => {
	const refresh = vi.fn();
	const progress = vi.fn();
	await refreshFeeds([], false, refresh, progress);
	expect(refresh).not.toHaveBeenCalled();
	expect(progress).not.toHaveBeenCalled();
});

test("skipped and unchanged feeds do not invalidate the displayed page", async () => {
	const progress = vi.fn();
	const refresh = vi
		.fn()
		.mockResolvedValueOnce({ data: [{ id: "fresh", status: "skipped" }] })
		.mockResolvedValueOnce({
			data: [{ id: "cached", status: "updated", changed: false }],
		})
		.mockResolvedValueOnce({
			data: [{ id: "new", status: "updated", changed: true }],
		});
	await refreshFeeds(["fresh", "cached", "new"], false, refresh, progress);
	expect(progress.mock.calls.map((call) => call[2])).toEqual([
		false,
		false,
		true,
	]);
});
