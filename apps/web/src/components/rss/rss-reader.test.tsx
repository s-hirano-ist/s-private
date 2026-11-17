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
		refreshRss: vi.fn(async () => ({ data: [] })),
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

test("refreshing on page two keeps its snapshot and cards until the user shows new arrivals", async () => {
	const refreshing =
		Promise.withResolvers<
			Awaited<
				ReturnType<
					NonNullable<Parameters<typeof RssReader>[0]["services"]["refreshRss"]>
				>
			>
		>();
	const loadRss = vi
		.fn()
		.mockResolvedValueOnce({
			...initial,
			offset: 50,
			unread: [entry("page-two")],
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
		refreshRss: vi.fn(() => refreshing.promise),
	});
	click("次へ");
	await screen.findByRole("link", { name: "page-two" });
	click("更新");
	await act(async () =>
		refreshing.resolve({
			data: [{ id: "feed", status: "updated" as const, changed: true }],
		}),
	);
	await screen.findByRole("button", { name: "新着2件を表示" });
	expect(screen.getByRole("link", { name: "page-two" })).toBeVisible();
	expect(screen.getByText("51–61 / 61")).toBeVisible();
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
	const refreshing =
		Promise.withResolvers<
			Awaited<
				ReturnType<
					NonNullable<Parameters<typeof RssReader>[0]["services"]["refreshRss"]>
				>
			>
		>();
	const { services } = setup({
		refreshRss: vi.fn(() => refreshing.promise),
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
	await act(async () =>
		refreshing.resolve({
			data: [{ id: "feed", status: "updated" as const, changed: true }],
		}),
	);
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
		refreshRss: vi.fn(async () => ({
			data: [{ id: "feed", status: "updated" as const, changed: true }],
		})),
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

test("old cards cannot be mutated during a page change and failed navigation can return", async () => {
	const next = Promise.withResolvers<RssPage>();
	const { services } = setup({ loadRss: vi.fn(() => next.promise) });
	click("次へ");
	fireEvent.click(screen.getByRole("link", { name: "one" }));
	expect(services.markRssRead).not.toHaveBeenCalled();
	expect(
		screen.getAllByRole("button", { name: "あとで読むに保存" })[0],
	).toBeDisabled();
	await act(async () => next.reject(new Error("Unavailable")));
	await screen.findByRole("alert");
	click("前へ");
	await waitFor(() =>
		expect(screen.getByRole("link", { name: "one" })).toHaveAttribute(
			"aria-disabled",
			"false",
		),
	);
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
	click("次へ");
	await waitFor(() => expect(screen.getByText("51–51 / 51")).toBeVisible());
	click("保存を解除");
	await screen.findByText("あとで読む記事はありません。");
	expect(screen.getByText("0–0 / 0")).toBeVisible();
	expect(screen.getByRole("button", { name: "前へ" })).toBeDisabled();
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
		refreshRss: vi.fn(async () => ({
			data: [{ id: "feed", status: "updated" as const, changed: true }],
		})),
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

test("refresh errors survive successful mutations and retry refreshes without replaying the mutation", async () => {
	const refreshRss = vi
		.fn()
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValue({ data: [] });
	const { services } = setup({ refreshRss });
	click("更新");
	await screen.findByRole("alert");
	fireEvent.click(
		screen.getAllByRole("button", { name: "あとで読むに保存" })[0],
	);
	await waitFor(() => expect(services.loadRss).toHaveBeenCalledTimes(1));
	expect(screen.getByRole("alert")).toBeVisible();
	click("再読み込み");
	await waitFor(() => expect(refreshRss).toHaveBeenCalledTimes(2));
	expect(services.saveRss).toHaveBeenCalledTimes(1);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
