import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import { useRssPage } from "@/components/rss/use-rss-page";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";

const initial: RssPage = {
	snapshotRevision: 0,
	newerCount: 0,
	offset: 0,
	feeds: [],
	unread: [],
	saved: [],
	unreadCount: 1,
	savedCount: 0,
};

test("a late background response cannot overwrite a newer filter", async () => {
	const background = Promise.withResolvers<RssPage>();
	const filtered = { ...initial, unreadCount: 2 };
	const readPage = vi
		.fn<() => Promise<RssPage>>()
		.mockReturnValueOnce(background.promise)
		.mockResolvedValue(filtered);
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ feedId }) => useRssPage(initial, readPage, 0, feedId, 1, setError),
		{ initialProps: { feedId: "" } },
	);
	expect(result.current.loading).toBe(false);
	expect(result.current.reloading).toBe(true);
	rerender({ feedId: "new-feed" });
	await waitFor(() => expect(result.current.data).toEqual(filtered));
	await act(async () => {
		background.resolve(initial);
		await background.promise;
	});
	expect(result.current.data).toEqual(filtered);
	expect(result.current.loading).toBe(false);
	expect(result.current.reloading).toBe(false);
	expect(setError).not.toHaveBeenCalled();
});

test("a background failure keeps the displayed page and controls available", async () => {
	const background = Promise.withResolvers<RssPage>();
	const readPage = vi.fn(() => background.promise);
	const setError = vi.fn();
	const { result } = renderHook(() =>
		useRssPage(initial, readPage, 0, "", 1, setError),
	);
	expect(result.current.loading).toBe(false);
	expect(result.current.reloading).toBe(true);
	await act(async () => {
		background.reject(new Error("Unavailable"));
		await background.promise.catch(() => {});
	});
	expect(result.current.data).toEqual(initial);
	expect(result.current.loading).toBe(false);
	expect(result.current.reloading).toBe(false);
	expect(setError).toHaveBeenCalledWith(true);
});

test("a stale response cannot clear the indicator for a newer page request", async () => {
	const background = Promise.withResolvers<RssPage>();
	const next = Promise.withResolvers<RssPage>();
	const readPage = vi
		.fn<() => Promise<RssPage>>()
		.mockReturnValueOnce(background.promise)
		.mockReturnValueOnce(next.promise);
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ offset }) => useRssPage(initial, readPage, offset, "", 1, setError),
		{ initialProps: { offset: 0 } },
	);
	rerender({ offset: 50 });
	await act(async () => {
		background.resolve(initial);
		await background.promise;
	});
	expect(result.current.reloading).toBe(true);
	expect(result.current.loading).toBe(false);
	expect(result.current.loadingMore).toBe(true);
	await act(async () => {
		next.resolve({ ...initial, offset: 0 });
		await next.promise;
	});
	expect(result.current.reloading).toBe(false);
	expect(result.current.loading).toBe(false);
});

test("SSR data is reused without a hydration GET", () => {
	const readPage = vi.fn();
	const { result } = renderHook(() =>
		useRssPage(initial, readPage, 0, "", 0, vi.fn()),
	);
	expect(result.current.data).toBe(initial);
	expect(result.current.reloading).toBe(false);
	expect(readPage).not.toHaveBeenCalled();
});
test("coalesces revisions during a slow background read into one follow-up", async () => {
	const background = Promise.withResolvers<RssPage>();
	const readPage = vi
		.fn()
		.mockReturnValueOnce(background.promise)
		.mockResolvedValue({ ...initial, unreadCount: 4 });
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ revision }) => useRssPage(initial, readPage, 0, "", revision, setError),
		{ initialProps: { revision: 1 } },
	);
	rerender({ revision: 2 });
	rerender({ revision: 3 });
	expect(readPage).toHaveBeenCalledTimes(1);
	await act(async () => {
		background.resolve(initial);
		await background.promise;
	});
	await waitFor(() => expect(result.current.data.unreadCount).toBe(4));
	expect(readPage).toHaveBeenCalledTimes(2);
	expect(result.current.reloading).toBe(false);
});
test("page changes abort a background read and returning to the SSR page ignores its late response", async () => {
	const background = Promise.withResolvers<RssPage>();
	const readPage = vi.fn(
		(_offset, _feed, _view, _signal) => background.promise,
	);
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ offset }) => useRssPage(initial, readPage, offset, "", 0, setError),
		{ initialProps: { offset: 0 } },
	);
	rerender({ offset: 50 });
	const signal = readPage.mock.calls[0][3] as AbortSignal;
	rerender({ offset: 0 });
	expect(signal.aborted).toBe(true);
	await act(async () => {
		background.resolve({ ...initial, unreadCount: 999 });
		await background.promise;
	});
	expect(result.current.data.unreadCount).toBe(1);
	expect(result.current.reloading).toBe(false);
});

test("a superseded page failure cannot set the current filter error", async () => {
	const stale = Promise.withResolvers<RssPage>();
	const readPage = vi
		.fn()
		.mockReturnValueOnce(stale.promise)
		.mockResolvedValue({ ...initial, unreadCount: 7 });
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ feedId }) => useRssPage(initial, readPage, 0, feedId, 1, setError),
		{ initialProps: { feedId: "" } },
	);
	rerender({ feedId: "new-feed" });
	await waitFor(() => expect(result.current.data.unreadCount).toBe(7));
	await act(async () => stale.reject(new Error("Stale failure")));
	expect(setError).not.toHaveBeenCalledWith(true);
});

const article = (index: number) => ({
	id: `article-${index}`,
	feedId: "feed",
	url: `https://example.com/${index}`,
	title: `Article ${index}`,
	publishedAt: null,
	receivedAt: "2026-11-17T00:00:00Z",
});
const batch = (
	entries: ReturnType<typeof article>[],
	offset: number,
	view: "unread" | "saved",
): RssPage => ({
	...initial,
	offset,
	unread: view === "unread" ? entries.slice(offset, offset + 50) : [],
	saved:
		view === "saved"
			? entries
					.slice(offset, offset + 50)
					.map((entry) =>
						Object.assign({}, entry, { savedAt: entry.receivedAt }),
					)
			: [],
	unreadCount: view === "unread" ? entries.length : 0,
	savedCount: view === "saved" ? entries.length : 0,
});

test.each(["unread", "saved"] as const)(
	"%s appends three batches and rebases the loaded range after a deletion",
	async (view) => {
		let entries = Array.from({ length: 120 }, (_, i) => article(i));
		const readPage = vi.fn(async (offset = 0) => batch(entries, offset, view));
		const first = batch(entries, 0, view);
		const setError = vi.fn();
		const { result, rerender } = renderHook(
			({ offset, revision }) =>
				useRssPage(first, readPage, offset, "", revision, setError, view),
			{ initialProps: { offset: 0, revision: 0 } },
		);
		expect(readPage).not.toHaveBeenCalled();
		rerender({ offset: 50, revision: 0 });
		await waitFor(() => expect(result.current.reloading).toBe(false));
		expect(result.current.data[view]).toHaveLength(100);
		entries = entries.slice(1);
		rerender({ offset: 50, revision: 1 });
		await waitFor(() =>
			expect(result.current.data[view][0].id).toBe("article-1"),
		);
		expect(result.current.data[view][99].id).toBe("article-100");
		rerender({ offset: 100, revision: 1 });
		await waitFor(() => expect(result.current.data[view]).toHaveLength(119));
		expect(result.current.data[view].map((entry) => entry.id)).toEqual(
			entries.map((entry) => entry.id),
		);
		expect(readPage.mock.calls.map((call) => call[0])).toEqual([
			50, 0, 50, 100,
		]);
		expect(result.current.hasMore).toBe(false);
		expect(setError).not.toHaveBeenCalled();
	},
);

test.each([0, 1, 50, 51, 120])(
	"the initial %i-entry list stops exactly at the batch boundary",
	(count) => {
		const first = batch(
			Array.from({ length: count }, (_, i) => article(i)),
			0,
			"unread",
		);
		const readPage = vi.fn();
		const { result } = renderHook(() =>
			useRssPage(first, readPage, 0, "", 0, vi.fn()),
		);
		expect(result.current.hasMore).toBe(count > 50);
		expect(readPage).not.toHaveBeenCalled();
	},
);

test("an additional read deduplicates IDs and an in-flight batch is not requested twice", async () => {
	const entries = Array.from({ length: 101 }, (_, i) => article(i));
	const pending = Promise.withResolvers<RssPage>();
	const readPage = vi.fn(() => pending.promise);
	const first = batch(entries, 0, "unread");
	const setError = vi.fn();
	const { result, rerender } = renderHook(
		({ offset }) => useRssPage(first, readPage, offset, "", 0, setError),
		{ initialProps: { offset: 0 } },
	);
	rerender({ offset: 50 });
	rerender({ offset: 50 });
	expect(readPage).toHaveBeenCalledTimes(1);
	expect(result.current.loadingMore).toBe(true);
	await act(async () =>
		pending.resolve({
			...batch(entries, 50, "unread"),
			unread: [article(49), article(50)],
		}),
	);
	expect(result.current.data.unread).toHaveLength(51);
	expect(
		new Set(result.current.data.unread.map((entry) => entry.id)).size,
	).toBe(51);
});

test("a shrinking list detected during append is rebased before publishing", async () => {
	const entries = Array.from({ length: 120 }, (_, i) => article(i));
	const remaining = entries.slice(1);
	const readPage = vi.fn(async (offset = 0) =>
		batch(remaining, offset, "unread"),
	);
	const first = batch(entries, 0, "unread");
	const { result, rerender } = renderHook(
		({ offset }) => useRssPage(first, readPage, offset, "", 0, vi.fn()),
		{ initialProps: { offset: 0 } },
	);
	rerender({ offset: 50 });
	await waitFor(() => expect(result.current.reloading).toBe(false));
	expect(result.current.data.unread.map((entry) => entry.id)).toEqual(
		remaining.slice(0, 100).map((entry) => entry.id),
	);
	expect(readPage.mock.calls.map((call) => call[0])).toEqual([50, 0, 50]);
});
