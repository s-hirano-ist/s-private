import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import { useRssPage } from "@/components/rss/use-rss-page";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";

const initial: RssPage = {
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
	expect(result.current.loading).toBe(true);
	await act(async () => {
		next.resolve(initial);
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
