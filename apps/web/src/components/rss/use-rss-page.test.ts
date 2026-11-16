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
		({ feedId }) => useRssPage(initial, readPage, 0, feedId, 0, setError),
		{ initialProps: { feedId: "" } },
	);
	expect(result.current.loading).toBe(false);
	rerender({ feedId: "new-feed" });
	await waitFor(() => expect(result.current.data).toEqual(filtered));
	await act(async () => {
		background.resolve(initial);
		await background.promise;
	});
	expect(result.current.data).toEqual(filtered);
	expect(result.current.loading).toBe(false);
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
	await act(async () => {
		background.reject(new Error("Unavailable"));
		await background.promise.catch(() => {});
	});
	expect(result.current.data).toEqual(initial);
	expect(result.current.loading).toBe(false);
	expect(setError).toHaveBeenCalledWith(true);
});
