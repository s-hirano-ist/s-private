import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import messages from "@/../messages/ja.json";
import { ViewerCountProvider } from "@/components/common/layouts/nav/viewer-count-context";
import { RssReader } from "@/components/rss/rss-reader";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expect, test, vi } from "vite-plus/test";

const entry = (id: string) => ({
	id,
	feedId: "feed",
	url: `https://example.com/${id}`,
	title: id,
	publishedAt: null,
	receivedAt: "2026-11-17T00:00:00Z",
});
const initial: RssPage = {
	snapshotRevision: 3,
	newerCount: 0,
	offset: 0,
	feeds: [
		{
			id: "feed",
			url: "https://example.com/rss",
			title: "Feed",
			folder: "",
			error: null,
			lastFetchedAt: new Date().toISOString(),
		},
	],
	unread: [entry("one"), entry("two")],
	unreadCount: 61,
	saved: [],
	savedCount: 0,
};
function setup(
	overrides: Partial<Parameters<typeof RssReader>[0]["services"]> = {},
	view: "unread" | "saved" = "unread",
	page = initial,
) {
	const services = {
		loadRss: vi.fn(async (offset = 0) => ({ ...page, offset })),
		markRssRead: vi.fn(async () => {}),
		saveRss: vi.fn(async () => {}),
		unsaveRss: vi.fn(async () => {}),
		subscribeRss: vi.fn(async () => {}),
		unsubscribeRss: vi.fn(async () => {}),
		importRss: vi.fn(async () => ({ added: 0, duplicates: 0, invalid: 0 })),
		...overrides,
	};
	const rendered = render(
		<NextIntlClientProvider locale="ja" messages={messages}>
			<ViewerCountProvider>
				<RssReader initialData={page} view={view} services={services} />
			</ViewerCountProvider>
		</NextIntlClientProvider>,
	);
	rendered.container.addEventListener("click", (event) => {
		if ((event.target as Element).closest("a")) event.preventDefault();
	});
	return { services, ...rendered };
}
const click = (name: string | RegExp) =>
	fireEvent.click(screen.getByRole("button", { name }));

test("refreshing the loaded prefix keeps its snapshot and cards until the user shows new arrivals", async () => {
	const loadRss = vi
		.fn()
		.mockResolvedValueOnce({
			...initial,
			offset: 50,
			unread: [entry("page-two")],
		})
		.mockResolvedValueOnce({
			...initial,
			offset: 0,
			newerCount: 2,
			unread: initial.unread,
		})
		.mockResolvedValueOnce({
			...initial,
			offset: 50,
			newerCount: 2,
			unread: [entry("page-two")],
		})
		.mockResolvedValueOnce({
			...initial,
			offset: 0,
			snapshotRevision: 4,
			unread: [entry("new")],
		});
	const { services } = setup({
		loadRss,
	});
	click("さらに読み込む");
	await screen.findByRole("link", { name: "page-two" });
	click("更新");
	await screen.findByRole("button", { name: "新着2件を表示" });
	expect(screen.getByRole("link", { name: "page-two" })).toBeVisible();
	expect(screen.getByText("3 / 61件を表示")).toBeVisible();
	expect(services.loadRss).toHaveBeenLastCalledWith(
		50,
		undefined,
		"unread",
		expect.any(AbortSignal),
		3,
	);
	click("新着2件を表示");
	await screen.findByRole("link", { name: "new" });
	expect(
		screen.queryByRole("button", { name: /新着/u }),
	).not.toBeInTheDocument();
	expect(services.loadRss).toHaveBeenLastCalledWith(
		0,
		undefined,
		"unread",
		expect.any(AbortSignal),
		undefined,
	);
});

test("mark-all during refresh uses the displayed snapshot and preserves the pending new-arrival notification", async () => {
	const { services } = setup({
		loadRss: vi.fn(async () => ({
			...initial,
			unread: [],
			unreadCount: 0,
			newerCount: 2,
		})),
	});
	click("更新");
	click("すべて既読にする");
	await waitFor(() =>
		expect(services.markRssRead).toHaveBeenCalledWith({ snapshotRevision: 3 }),
	);
	await screen.findByText("未読記事はありません。");
	expect(
		await screen.findByRole("button", { name: "新着2件を表示" }),
	).toBeEnabled();
});

test("opening articles rapidly serializes distinct reads, deduplicates clicks and holds busy until all settle", async () => {
	const first = Promise.withResolvers<undefined>();
	const second = Promise.withResolvers<undefined>();
	const markRssRead = vi
		.fn()
		.mockReturnValueOnce(first.promise)
		.mockReturnValueOnce(second.promise);
	const { services } = setup({ markRssRead });
	fireEvent.click(screen.getByRole("link", { name: "one" }));
	fireEvent.click(screen.getByRole("link", { name: "one" }));
	fireEvent.click(screen.getByRole("link", { name: "two" }));
	await waitFor(() => expect(markRssRead).toHaveBeenCalledTimes(1));
	await act(async () => first.resolve(undefined));
	expect(markRssRead).toHaveBeenNthCalledWith(2, { ids: ["two"] });
	expect(
		screen.getByRole("button", { name: "すべて既読にする" }),
	).toBeDisabled();
	expect(services.loadRss).not.toHaveBeenCalled();
	await act(async () => second.resolve(undefined));
	await waitFor(() => expect(services.loadRss).toHaveBeenCalledTimes(1));
	expect(
		screen.getByRole("button", { name: "すべて既読にする" }),
	).toBeEnabled();
});

test("a pre-mutation response cannot resurrect read articles even if it ignores abort", async () => {
	const stale = Promise.withResolvers<RssPage>();
	const read = Promise.withResolvers<undefined>();
	const loadRss = vi
		.fn()
		.mockReturnValueOnce(stale.promise)
		.mockResolvedValue({ ...initial, unread: [], unreadCount: 0 });
	setup({
		loadRss,
		markRssRead: vi.fn(() => read.promise),
	});
	click("更新");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(1));
	click("すべて既読にする");
	expect(loadRss.mock.calls[0][3].aborted).toBe(true);
	await act(async () => read.resolve(undefined));
	await screen.findByText("未読記事はありません。");
	await act(async () => stale.resolve(initial));
	expect(screen.queryByRole("link", { name: "one" })).not.toBeInTheDocument();
});

test("changing filter while a mutation is pending waits and reloads the current filter", async () => {
	const read = Promise.withResolvers<undefined>();
	const { services } = setup({ markRssRead: vi.fn(() => read.promise) });
	click("すべて既読にする");
	fireEvent.change(screen.getByRole("combobox"), { target: { value: "feed" } });
	expect(services.loadRss).not.toHaveBeenCalled();
	await act(async () => read.resolve(undefined));
	await waitFor(() =>
		expect(services.loadRss).toHaveBeenLastCalledWith(
			0,
			"feed",
			"unread",
			expect.any(AbortSignal),
			3,
		),
	);
	click("すべて既読にする");
	await waitFor(() =>
		expect(services.markRssRead).toHaveBeenLastCalledWith({
			feedId: "feed",
			snapshotRevision: 3,
		}),
	);
});

test("a failed mutation is not retried and does not prevent the next queued read", async () => {
	const first = Promise.withResolvers<undefined>();
	const markRssRead = vi
		.fn()
		.mockReturnValueOnce(first.promise)
		.mockResolvedValue(undefined);
	const { services } = setup({ markRssRead });
	fireEvent.click(screen.getByRole("link", { name: "one" }));
	fireEvent.click(screen.getByRole("link", { name: "two" }));
	await act(async () => first.reject(new Error("Unavailable")));
	await screen.findByRole("alert");
	await waitFor(() => expect(services.loadRss).toHaveBeenCalledTimes(1));
	expect(markRssRead).toHaveBeenCalledTimes(2);
	expect(screen.getByRole("link", { name: "one" })).toBeVisible();
});

test("additional loading preserves usable cards and retries a failed read", async () => {
	const next = Promise.withResolvers<RssPage>();
	const loadRss = vi
		.fn()
		.mockReturnValueOnce(next.promise)
		.mockImplementation(async (offset = 0) => ({ ...initial, offset }));
	const { services } = setup({ loadRss });
	click("さらに読み込む");
	expect(screen.getByRole("link", { name: "one" })).toHaveAttribute(
		"aria-disabled",
		"false",
	);
	expect(
		screen.getAllByRole("button", { name: "あとで読むに保存" })[0],
	).toBeEnabled();
	await act(async () => next.reject(new Error("Unavailable")));
	await screen.findByRole("alert");
	expect(loadRss).toHaveBeenCalledTimes(1);
	click("再読み込み");
	await waitFor(() =>
		expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
	);
	expect(services.markRssRead).not.toHaveBeenCalled();
});

test("removing the last saved entry adopts the server's corrected page without a second fetch", async () => {
	const saved = {
		id: "saved",
		url: "https://example.com/saved",
		title: "saved",
		publishedAt: null,
		savedAt: "2026-11-17T00:00:00Z",
	};
	const loadRss = vi
		.fn()
		.mockResolvedValueOnce({
			...initial,
			offset: 50,
			saved: [saved],
			savedCount: 51,
		})
		.mockResolvedValue({ ...initial, offset: 0, saved: [], savedCount: 0 });
	setup({ loadRss }, "saved", { ...initial, saved: [saved], savedCount: 51 });
	click("さらに読み込む");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(1));
	click("保存を解除");
	await screen.findByText("あとで読む記事はありません。");
	expect(screen.getByText("0 / 0件を表示")).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "さらに読み込む" }),
	).not.toBeInTheDocument();
	expect(loadRss).toHaveBeenCalledTimes(2);
});

test("unmount discards queued reads and late callbacks", async () => {
	const first = Promise.withResolvers<undefined>();
	const { services, unmount } = setup({
		markRssRead: vi.fn(() => first.promise),
	});
	fireEvent.click(screen.getByRole("link", { name: "one" }));
	fireEvent.click(screen.getByRole("link", { name: "two" }));
	await waitFor(() => expect(services.markRssRead).toHaveBeenCalledTimes(1));
	unmount();
	await act(async () => first.resolve(undefined));
	expect(services.markRssRead).toHaveBeenCalledTimes(1);
	expect(services.loadRss).not.toHaveBeenCalled();
});

test("an old background response cannot undo a successful star toggle", async () => {
	const stale = Promise.withResolvers<RssPage>();
	const saved = {
		...initial,
		unread: [{ ...entry("one"), savedId: "saved" }, entry("two")],
	};
	const loadRss = vi
		.fn()
		.mockReturnValueOnce(stale.promise)
		.mockResolvedValue(saved);
	setup({
		loadRss,
	});
	click("更新");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(1));
	fireEvent.click(
		screen.getAllByRole("button", { name: "あとで読むに保存" })[0],
	);
	await screen.findByRole("button", { name: "保存を解除" });
	await act(async () => stale.resolve(initial));
	expect(screen.getByRole("button", { name: "保存を解除" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});

test("DB read failures preserve cards and retry does not replay mutations", async () => {
	const loadRss = vi
		.fn()
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValue(initial);
	const { services } = setup({ loadRss });
	click("更新");
	await screen.findByRole("alert");
	expect(screen.getByRole("link", { name: "one" })).toBeVisible();
	click("再読み込み");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(2));
	expect(services.saveRss).not.toHaveBeenCalled();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("stale subscriptions do not trigger feed requests or duplicate SSR reads", () => {
	const { services } = setup({}, "unread", {
		...initial,
		feeds: initial.feeds.map((feed) =>
			Object.assign({}, feed, { lastFetchedAt: null }),
		),
	});
	expect(services.loadRss).not.toHaveBeenCalled();
	expect(screen.getByRole("button", { name: "更新" })).toBeEnabled();
});

test("returning to the window reloads DB metadata without moving the read boundary", async () => {
	const { services } = setup();
	fireEvent.focus(window);
	await waitFor(() =>
		expect(services.loadRss).toHaveBeenCalledWith(
			0,
			undefined,
			"unread",
			expect.any(AbortSignal),
			3,
		),
	);
});

test("periodic DB reads pause while hidden and resume without changing the displayed generation", async () => {
	vi.useFakeTimers();
	const visibility = vi
		.spyOn(document, "visibilityState", "get")
		.mockReturnValue("hidden");
	const { services, unmount } = setup();
	try {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(services.loadRss).not.toHaveBeenCalled();
		visibility.mockReturnValue("visible");
		await act(async () => {
			fireEvent(document, new Event("visibilitychange"));
		});
		expect(services.loadRss).toHaveBeenCalledTimes(1);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(services.loadRss).toHaveBeenCalledTimes(2);
		unmount();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(services.loadRss).toHaveBeenCalledTimes(2);
	} finally {
		unmount();
		visibility.mockRestore();
		vi.useRealTimers();
	}
});

test("mark-all during an additional read cancels the batch and ignores its late result", async () => {
	const pending = Promise.withResolvers<RssPage>();
	const loadRss = vi
		.fn()
		.mockReturnValueOnce(pending.promise)
		.mockResolvedValue({ ...initial, unread: [], unreadCount: 0 });
	const { services } = setup({ loadRss });
	click("さらに読み込む");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(1));
	click("すべて既読にする");
	await screen.findByText("未読記事はありません。");
	expect(services.markRssRead).toHaveBeenCalledWith({ snapshotRevision: 3 });
	expect(loadRss.mock.calls[0][3].aborted).toBe(true);
	await act(async () =>
		pending.resolve({ ...initial, offset: 50, unread: [entry("late")] }),
	);
	expect(screen.queryByRole("link", { name: "late" })).not.toBeInTheDocument();
});

test("changing the filter aborts an append and discards its late failure", async () => {
	const pending = Promise.withResolvers<RssPage>();
	const loadRss = vi
		.fn()
		.mockReturnValueOnce(pending.promise)
		.mockResolvedValue({
			...initial,
			unread: [entry("filtered")],
			unreadCount: 1,
		});
	setup({ loadRss });
	click("さらに読み込む");
	await waitFor(() => expect(loadRss).toHaveBeenCalledTimes(1));
	fireEvent.change(screen.getByRole("combobox"), { target: { value: "feed" } });
	await screen.findByRole("link", { name: "filtered" });
	expect(loadRss.mock.calls[0][3].aborted).toBe(true);
	await act(async () => pending.reject(new Error("Stale batch")));
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(screen.getByText("1 / 1件を表示")).toBeVisible();
});
