import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ViewerCountProvider } from "@/components/common/layouts/nav/viewer-count-context";
import { RssReader } from "@/components/rss/rss-reader";
import { expect, fn, mocked, userEvent, waitFor } from "storybook/test";
const feedId = "00000000-0000-4000-8000-000000000001";
const entryId = "00000000-0000-4000-8000-000000000002";
const page: RssPage = {
	snapshotRevision: 0,
	newerCount: 0,
	offset: 0,
	feeds: [
		{
			id: feedId,
			url: "https://example.com/feed",
			title: "Engineering",
			folder: "Technology",
			lastFetchedAt: "2026-11-15T00:00:00.000Z",
			error: null,
		},
	],
	unread: [
		{
			id: entryId,
			feedId,
			url: "https://example.com/article",
			title: "RSSを軽量に読む",
			publishedAt: null,
			receivedAt: "2026-11-15T00:00:00.000Z",
		},
	],
	saved: [],
	unreadCount: 1,
	savedCount: 0,
};
const services = {
	loadRss: fn(() => Promise.resolve(page)),
	subscribeRss: fn(() => Promise.resolve(undefined)),
	unsubscribeRss: fn(() => Promise.resolve(undefined)),
	markRssRead: fn(() => Promise.resolve(undefined)),
	saveRss: fn(() => Promise.resolve(undefined)),
	unsaveRss: fn(() => Promise.resolve(undefined)),
	importRss: fn(() => Promise.resolve({ added: 1, duplicates: 0, invalid: 0 })),
};
const meta = {
	component: RssReader,
	decorators: [
		(Story) => (
			<ViewerCountProvider>
				<Story />
			</ViewerCountProvider>
		),
	],
	args: { initialData: page, services },
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RssReader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unread: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.queryByRole("button", { name: "購読管理" }),
		).not.toBeInTheDocument();
		const article = await canvas.findByRole("link", {
			name: "RSSを軽量に読む",
		});
		await expect(article).toHaveAttribute("target", "_blank");
		article.addEventListener("click", (event) => event.preventDefault(), {
			once: true,
		});
		await userEvent.click(article);
		await expect(services.markRssRead).not.toHaveBeenCalled();
		await expect(article).toBeVisible();
		await userEvent.click(
			canvas.getByRole("button", { name: "あとで読むに保存" }),
		);
		await expect(services.saveRss).toHaveBeenCalledWith({
			url: "https://example.com/article",
			title: "RSSを軽量に読む",
			publishedAt: null,
		});
		await expect(
			canvas.queryByRole("button", { name: "既読にする" }),
		).not.toBeInTheDocument();
		await userEvent.click(
			canvas.getByRole("button", { name: "すべて既読にする" }),
		);
		await expect(services.markRssRead).toHaveBeenCalledWith({
			snapshotRevision: 0,
		});
	},
};
const empty = {
	snapshotRevision: 0,
	newerCount: 0,
	offset: 0,
	feeds: [],
	unread: [],
	saved: [],
	unreadCount: 0,
	savedCount: 0,
};
export const Empty: Story = {
	args: {
		initialData: empty,
		services: { ...services, loadRss: fn(() => Promise.resolve(empty)) },
	},
	play: async ({ canvas }) => {
		await expect(
			await canvas.findByText("未読記事はありません。"),
		).toBeVisible();
	},
};
export const Saved: Story = {
	args: {
		view: "saved",
		initialData: {
			...page,
			saved: [
				{
					id: entryId,
					url: "https://example.com/saved",
					title: "保存した記事",
					publishedAt: null,
					savedAt: "2026-11-15T00:00:00.000Z",
				},
			],
			savedCount: 1,
		},
		services: {
			...services,
			loadRss: fn(() =>
				Promise.resolve({
					...page,
					saved: [
						{
							id: entryId,
							url: "https://example.com/saved",
							title: "保存した記事",
							publishedAt: null,
							savedAt: "2026-11-15T00:00:00.000Z",
						},
					],
					savedCount: 1,
				}),
			),
		},
	},
	play: async ({ canvas }) => {
		await expect(
			await canvas.findByRole("link", { name: "保存した記事" }),
		).toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: "保存を解除" }));
		await expect(services.unsaveRss).toHaveBeenCalledWith(entryId);
	},
};
export const Subscriptions: Story = {
	args: {
		view: "feeds",
		services: {
			...services,
		},
	},
	play: async ({ canvas }) => {
		await userEvent.type(
			canvas.getByLabelText("フィードURL"),
			"https://example.com/new-feed",
		);
		await userEvent.click(canvas.getByRole("button", { name: "購読する" }));
		await expect(services.subscribeRss).toHaveBeenCalledWith({
			url: "https://example.com/new-feed",
			title: "https://example.com/new-feed",
			folder: "",
		});
		await expect(canvas.getByText("Inoreaderから取り込み")).toBeVisible();
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "購読する" })).toBeEnabled(),
		);
		await expect(canvas.getByLabelText("取り込みファイル")).toBeEnabled();
	},
};
export const FetchFailure: Story = {
	args: {
		services: {
			...services,
			loadRss: fn(async () => {
				throw new Error("Offline");
			}),
		},
	},
	play: async ({ canvas, args }) => {
		await userEvent.click(canvas.getByRole("button", { name: "更新" }));
		await expect(await canvas.findByRole("alert")).toBeVisible();
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
		const refresh = canvas.getByRole("button", { name: "更新" });
		await expect(refresh).toBeEnabled();
		await expect(refresh).toHaveAttribute("aria-busy", "false");
		await expect(refresh.querySelector(".animate-spin")).toBeNull();
		await userEvent.click(canvas.getByRole("button", { name: "再読み込み" }));
		await waitFor(() => expect(args.services.loadRss).toHaveBeenCalledTimes(2));
		await expect(await canvas.findByRole("alert")).toBeVisible();
		await expect(refresh).toBeEnabled();
		await expect(refresh).toHaveAttribute("aria-busy", "false");
	},
};

export const BackgroundReadPending: Story = {
	args: {
		services: {
			...services,
			loadRss: fn(() => new Promise<RssPage>(() => {})),
		},
	},
	play: async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "更新" }));
		await waitFor(() => expect(args.services.loadRss).toHaveBeenCalledTimes(1));
		await expect(canvas.getByRole("status")).toHaveAccessibleName(
			"読み込み中…",
		);
		await expect(
			canvas.getByRole("button", { name: "すべて既読にする" }),
		).toBeEnabled();
		await userEvent.click(
			canvas.getByRole("button", { name: "あとで読むに保存" }),
		);
		await expect(args.services.saveRss).toHaveBeenCalled();
	},
};

const infinitePage = (offset = 0, count = 120): RssPage => ({
	...page,
	offset,
	unreadCount: count,
	unread: Array.from({ length: Math.min(50, count - offset) }, (_, index) => ({
		...page.unread[0],
		id: `article-${offset + index}`,
		url: `https://example.com/article/${offset + index}`,
		title: `記事 ${offset + index + 1}`,
	})),
});
export const InfiniteScroll: Story = {
	args: {
		initialData: infinitePage(),
		services: {
			...services,
			loadRss: fn(async (offset = 0) => infinitePage(offset)),
		},
	},
	play: async ({ canvas }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: "さらに読み込む" }),
		);
		await expect(
			await canvas.findByRole("link", { name: "記事 51" }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole("link", { name: "記事 1" }),
		).toBeInTheDocument();
		const more = canvas.getByRole("button", { name: "さらに読み込む" });
		await userEvent.click(more);
		await expect(await canvas.findByText("120 / 120件を表示")).toBeVisible();
		await expect(
			canvas.queryByRole("button", { name: "さらに読み込む" }),
		).not.toBeInTheDocument();
	},
};
export const AdditionalReadPending: Story = {
	args: {
		initialData: infinitePage(),
		services: {
			...services,
			loadRss: fn(() => new Promise<RssPage>(() => {})),
		},
	},
	play: async ({ canvas }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: "さらに読み込む" }),
		);
		await expect(
			canvas.getByRole("button", { name: "さらに読み込む" }),
		).toBeDisabled();
		await expect(
			canvas.getByRole("status", { name: "読み込み中…" }),
		).toHaveAccessibleName("読み込み中…");
		await expect(canvas.getByRole("link", { name: "記事 1" })).toHaveAttribute(
			"aria-disabled",
			"false",
		);
	},
};
let failAdditionalRead = true;
const retryRead = fn(async (offset = 0) => {
	if (offset === 50 && failAdditionalRead) {
		failAdditionalRead = false;
		throw new Error("Offline");
	}
	return infinitePage(offset);
});
export const AdditionalReadFailure: Story = {
	args: {
		initialData: infinitePage(),
		services: {
			...services,
			loadRss: retryRead,
		},
	},
	beforeEach: () => {
		failAdditionalRead = true;
	},
	play: async ({ canvas }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: "さらに読み込む" }),
		);
		await expect(await canvas.findByRole("alert")).toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: "再読み込み" }));
		await expect(
			await canvas.findByRole("link", { name: "記事 51" }),
		).toBeInTheDocument();
		await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
	},
};

export const SubscriptionWaitsForServerPolling: Story = {
	args: {
		view: "feeds",
		initialData: empty,
		services: {
			...services,
		},
	},
	play: async ({ args, canvas }) => {
		await userEvent.type(
			canvas.getByLabelText("フィードURL"),
			"https://example.com/feed",
		);
		await userEvent.click(canvas.getByRole("button", { name: "購読する" }));
		await waitFor(() => expect(args.services.loadRss).toHaveBeenCalled());
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "購読する" })).toBeEnabled(),
		);
		await expect(canvas.getByLabelText("取り込みファイル")).toBeEnabled();
		await expect(
			canvas.getByRole("button", { name: "購読解除" }),
		).toBeEnabled();
	},
};

const longFeedTitle =
	"とても長い購読名とフォルダー名を持つフィードのモバイル表示を確認するための記事一覧";
const narrowPage = {
	...page,
	snapshotRevision: 0,
	newerCount: 0,
	offset: 0,
	feeds: [
		{
			...page.feeds[0],
			title: longFeedTitle,
			folder: "Technology / Engineering / Web Development",
		},
	],
};
export const NarrowFeedFilter: Story = {
	globals: { viewport: { value: "mobile1" } },
	args: {
		initialData: narrowPage,
		services: { ...services, loadRss: fn(async () => narrowPage) },
	},
	decorators: [
		(Story) => (
			<div className="w-80 max-w-full">
				<Story />
			</div>
		),
	],
	play: async ({ args, canvas, canvasElement }) => {
		const filter = canvas.getByRole("combobox", { name: "購読で絞り込み" });
		const main = canvas.getByRole("main");
		await expect(filter).toBeVisible();
		await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
		await userEvent.selectOptions(filter, feedId);
		await waitFor(() => expect(filter).toHaveValue(feedId));
		await waitFor(() =>
			expect(args.services.loadRss).toHaveBeenCalledWith(
				0,
				feedId,
				"unread",
				expect.any(AbortSignal),
				0,
			),
		);
		await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
		await expect(filter.getBoundingClientRect().right).toBeLessThanOrEqual(
			main.getBoundingClientRect().right,
		);
		await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
			canvasElement.clientWidth,
		);
	},
};

export const SubscriptionImport: Story = {
	args: {
		view: "feeds",
		services: {
			...services,
		},
	},
	play: async ({ args, canvas }) => {
		const content =
			'<opml><body><outline xmlUrl="https://example.com/feed" title="Engineering"/></body></opml>';
		await userEvent.upload(
			canvas.getByLabelText("取り込みファイル"),
			new File([content], "subscriptions.xml", { type: "application/xml" }),
		);
		await waitFor(() =>
			expect(args.services.importRss).toHaveBeenCalledWith("opml", content),
		);
		await expect(
			await canvas.findByText("追加 1件・重複 0件・不正 0件"),
		).toBeVisible();
		await waitFor(() =>
			expect(canvas.getByLabelText("取り込みファイル")).toBeEnabled(),
		);
	},
};
export const SubscriptionRemoval: Story = {
	args: {
		view: "feeds",
		services: {
			...services,
			unsubscribeRss: fn(async () => undefined),
			loadRss: fn(async () => page),
		},
	},
	beforeEach: () => {
		const original = window.confirm;
		window.confirm = fn(() => true);
		return () => {
			window.confirm = original;
		};
	},
	play: async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "購読解除" }));
		await waitFor(() =>
			expect(args.services.unsubscribeRss).toHaveBeenCalledWith(feedId),
		);
		await expect(
			canvas.getByRole("heading", { name: "Inoreaderから取り込み" }),
		).toBeVisible();
	},
};

const cardPage: RssPage = {
	...page,
	unread: Array.from({ length: 4 }, (_, index) => ({
		...page.unread[0],
		id: `00000000-0000-4000-8000-${String(index + 2).padStart(12, "0")}`,
		title: [
			"RSSを軽量に読む",
			"Designing accessible interfaces for everyday reading",
			"長い記事タイトルでも読みやすく、カードの操作を見つけやすくする",
			"Next.jsのデータ取得を整理する",
		][index],
		publishedAt: "2026-11-15T00:00:00.000Z",
	})),
	unreadCount: 4,
};
export const DesktopCards: Story = {
	args: {
		initialData: cardPage,
		services: { ...services, loadRss: fn(async () => cardPage) },
	},
	decorators: [
		(Story) => (
			<div className="w-[960px]">
				<Story />
			</div>
		),
	],
	globals: { viewport: { value: "desktop" } },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("link")).toHaveLength(4);
		await expect(
			canvas.queryByRole("heading", { name: "RSSリーダー" }),
		).not.toBeInTheDocument();
		await expect(canvas.getByText("購読で絞り込み")).toHaveClass("sr-only");
	},
};
export const DarkCards: Story = {
	...DesktopCards,
	globals: {
		theme: "dark",
		backgrounds: { value: "black" },
		viewport: { value: "desktop" },
	},
};
export const EnglishMobile: Story = {
	args: {
		initialData: cardPage,
		services: { ...services, loadRss: fn(async () => cardPage) },
	},
	globals: { locale: "en", viewport: { value: "mobile1" } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("combobox", { name: "Filter by subscription" }),
		).toBeVisible();
		await expect(
			canvas.queryByText(
				"Keep up with unread articles and save links for later.",
			),
		).not.toBeInTheDocument();
	},
};

const illustratedPage: RssPage = {
	...cardPage,
	unread: cardPage.unread.map((entry, index) =>
		Object.assign({}, entry, {
			imageUrl: index === 1 ? null : "/storybook/rss-thumbnail.svg",
		}),
	),
};
export const ArticleThumbnails: Story = {
	args: {
		initialData: illustratedPage,
		services: { ...services, loadRss: fn(async () => illustratedPage) },
	},
	globals: { viewport: { value: "mobile1" } },
	play: async ({ canvas, args }) => {
		const stars = canvas.getAllByRole("button", { name: "あとで読むに保存" });
		await expect(stars).toHaveLength(4);
		await expect(stars[0]).toHaveAttribute("aria-pressed", "false");
		await userEvent.click(stars[0]);
		await expect(args.services.saveRss).toHaveBeenCalledWith(
			expect.objectContaining({ imageUrl: "/storybook/rss-thumbnail.svg" }),
		);
		await expect(
			canvas.queryByRole("button", { name: "既読にする" }),
		).not.toBeInTheDocument();
	},
};
export const SavedStarInUnread: Story = {
	args: {
		initialData: { ...page, unread: [{ ...page.unread[0], savedId: entryId }] },
		services: {
			...services,
			loadRss: fn(async () => ({
				...page,
				unread: [{ ...page.unread[0], savedId: entryId }],
			})),
		},
	},
	play: async ({ canvas, args }) => {
		const star = canvas.getByRole("button", { name: "保存を解除" });
		await expect(star).toHaveAttribute("aria-pressed", "true");
		await userEvent.click(star);
		await expect(args.services.unsaveRss).toHaveBeenCalledWith(entryId);
	},
};
export const FailedThumbnail: Story = {
	args: {
		initialData: {
			...page,
			unread: [
				{ ...page.unread[0], imageUrl: "/storybook/missing-thumbnail.png" },
			],
		},
		services: {
			...services,
			loadRss: fn(async () => ({
				...page,
				unread: [
					{ ...page.unread[0], imageUrl: "/storybook/missing-thumbnail.png" },
				],
			})),
		},
	},
	play: async ({ canvas, canvasElement }) => {
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
		await waitFor(() =>
			expect(canvasElement.querySelector("img")).not.toBeInTheDocument(),
		);
	},
};

export const FreshSubscriptions: Story = {
	args: {
		initialData: {
			...page,
			feeds: page.feeds.map((feed) => ({
				...feed,
				lastFetchedAt: new Date().toISOString(),
			})),
		},
		services: {
			...services,
			loadRss: fn(async () => page),
		},
	},
	play: async ({ args, canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
		await expect(args.services.loadRss).not.toHaveBeenCalled();
		await expect(canvas.getByRole("button", { name: "更新" })).toBeEnabled();
	},
};

export const NewArrivalsWhileReadingLoadedArticles: Story = {
	args: {
		initialData: infinitePage(0, 61),
		services: {
			...services,
			loadRss: fn(
				async (
					offset = 0,
					_feed?: string,
					_view?: string,
					_signal?: AbortSignal,
					snapshot?: number,
				) => ({
					...infinitePage(offset, 61),
					snapshotRevision: snapshot ?? 1,
					newerCount: snapshot === 0 ? 3 : 0,
					...(snapshot === undefined
						? {
								unread: [{ ...page.unread[0], title: "更新後の新着記事" }],
								unreadCount: 1,
							}
						: {}),
				}),
			),
		},
	},
	play: async ({ canvas }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: "さらに読み込む" }),
		);
		await expect(
			await canvas.findByRole("link", { name: "記事 51" }),
		).toBeInTheDocument();
		await expect(canvas.getByText("61 / 61件を表示")).toBeVisible();
		await userEvent.click(
			canvas.getByRole("button", { name: "新着3件を表示" }),
		);
		await expect(
			await canvas.findByRole("link", { name: "更新後の新着記事" }),
		).toBeVisible();
		await expect(canvas.getByText("1 / 1件を表示")).toBeVisible();
	},
};

export const ReadSnapshotEmptyWithNewArrivals: Story = {
	args: {
		initialData: { ...page, unread: [], unreadCount: 0, newerCount: 3 },
		services: {
			...services,
			loadRss: fn(async () => ({ ...page, snapshotRevision: 1 })),
		},
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("未読記事はありません。")).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: "すべて既読にする" }),
		).toBeDisabled();
		await userEvent.click(
			canvas.getByRole("button", { name: "新着3件を表示" }),
		);
		await expect(
			await canvas.findByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
	},
};

export const NewArrivalsOnMobile: Story = {
	args: { initialData: { ...page, newerCount: 12 } },
	globals: { viewport: { value: "mobile1" } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: "新着12件を表示" }),
		).toBeVisible();
		const main = canvas.getByRole("main");
		await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
	},
};

const refreshWithoutLayoutShift: Story["play"] = async ({
	args,
	canvas,
	canvasElement,
	globals,
}) => {
	if (!args.services.loadRss) throw new Error("A mock reader is required");
	await canvasElement.ownerDocument.fonts.ready;
	const pending = Promise.withResolvers<RssPage>();
	mocked(args.services.loadRss).mockReturnValueOnce(pending.promise);
	const refreshLabel = globals.locale === "en" ? "Refresh" : "更新";
	const loadingLabel = globals.locale === "en" ? "Loading…" : "読み込み中…";
	const refresh = canvas.getByRole("button", { name: refreshLabel });
	const elements = canvasElement.querySelectorAll("button, select, section");
	const positions = () =>
		Array.from(elements, (element) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return { x, y, width, height };
		});
	const before = positions();
	await userEvent.click(refresh);
	await expect(refresh).toHaveAttribute("aria-busy", "true");
	await expect(refresh).toBeDisabled();
	await expect(refresh).toHaveTextContent(refreshLabel);
	await expect(canvas.getByRole("status")).toHaveAccessibleName(loadingLabel);
	await expect(canvas.getByRole("status")).toHaveClass("sr-only");
	const spinner = refresh.querySelector(".animate-spin");
	await expect(spinner).not.toBeNull();
	await expect(spinner).toHaveClass("motion-reduce:animate-none");
	await expect(canvasElement.querySelectorAll(".animate-spin")).toHaveLength(1);
	await expect(positions()).toEqual(before);
	pending.resolve(args.initialData);
	await waitFor(() => expect(refresh).toHaveAttribute("aria-busy", "false"));
	await expect(refresh).toBeEnabled();
	await expect(refresh.querySelector(".animate-spin")).toBeNull();
	await expect(positions()).toEqual(before);
};

export const RefreshWithoutLayoutShift: Story = {
	args: {
		initialData: { ...page, newerCount: 3 },
		services: { ...services, loadRss: fn(async () => page) },
	},
	decorators: DesktopCards.decorators,
	globals: { locale: "ja", viewport: { value: "desktop" } },
	play: refreshWithoutLayoutShift,
};

export const RefreshWithoutLayoutShiftOnMobile: Story = {
	...RefreshWithoutLayoutShift,
	decorators: [],
	globals: { locale: "en", viewport: { value: "mobile1" } },
};

export const SavedRefreshWithoutLayoutShift: Story = {
	...RefreshWithoutLayoutShift,
	args: {
		...Saved.args,
		services: { ...services, loadRss: fn(async () => page) },
	},
};

export const SavedRefreshWithoutLayoutShiftOnMobile: Story = {
	...SavedRefreshWithoutLayoutShift,
	decorators: [],
	globals: { locale: "en", viewport: { value: "mobile1" } },
};

export const SubscriptionsRefreshWithoutLayoutShift: Story = {
	...RefreshWithoutLayoutShift,
	args: {
		view: "feeds",
		services: { ...services, loadRss: fn(async () => page) },
	},
};

export const SubscriptionsRefreshWithoutLayoutShiftOnMobile: Story = {
	...SubscriptionsRefreshWithoutLayoutShift,
	decorators: [],
	globals: { locale: "en", viewport: { value: "mobile1" } },
};

export const SavePending: Story = {
	args: {
		services: {
			...services,
			saveRss: fn(async () => undefined),
			loadRss: fn(async () => page),
		},
	},
	play: async ({ args, canvas }) => {
		if (!args.services.loadRss) throw new Error("A mock reader is required");
		const save = Promise.withResolvers<undefined>();
		const read = Promise.withResolvers<RssPage>();
		mocked(args.services.saveRss).mockReturnValueOnce(save.promise);
		mocked(args.services.loadRss).mockReturnValueOnce(read.promise);
		const refresh = canvas.getByRole("button", { name: "更新" });
		await userEvent.click(
			canvas.getByRole("button", { name: "あとで読むに保存" }),
		);
		await expect(args.services.saveRss).toHaveBeenCalledTimes(1);
		await expect(refresh).toHaveAttribute("aria-busy", "true");
		await expect(refresh).toBeDisabled();
		await expect(refresh.querySelector(".animate-spin")).not.toBeNull();
		save.resolve(undefined);
		await waitFor(() => expect(args.services.loadRss).toHaveBeenCalledTimes(1));
		await expect(refresh).toHaveAttribute("aria-busy", "true");
		read.resolve(args.initialData);
		await waitFor(() => expect(refresh).toHaveAttribute("aria-busy", "false"));
		await expect(refresh).toBeEnabled();
		await expect(refresh.querySelector(".animate-spin")).toBeNull();
	},
};
