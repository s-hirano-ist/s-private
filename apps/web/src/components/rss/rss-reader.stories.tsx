import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ViewerCountProvider } from "@/components/common/layouts/nav/viewer-count-context";
import { RssReader } from "@/components/rss/rss-reader";
import { expect, fn, userEvent, waitFor } from "storybook/test";
const feedId = "00000000-0000-4000-8000-000000000001";
const entryId = "00000000-0000-4000-8000-000000000002";
const page: RssPage = {
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
	refreshRss: fn(() => Promise.resolve({ data: [] })),
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
		await expect(
			await canvas.findByRole("link", { name: "RSSを軽量に読む" }),
		).toHaveAttribute("target", "_blank");
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
			before: expect.any(String),
		});
	},
};
const empty = {
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
			refreshRss: fn(() => new Promise<{ data: [] }>(() => {})),
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
			refreshRss: fn(() =>
				Promise.resolve({
					data: [{ id: feedId, status: "failed" as const }],
				}),
			),
		},
	},
	play: async ({ canvas }) => {
		await expect(await canvas.findByRole("alert")).toBeVisible();
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
	},
};
export const Fetching: Story = {
	args: {
		services: {
			...services,
			refreshRss: fn(
				() =>
					new Promise<Awaited<ReturnType<typeof services.refreshRss>>>(
						() => {},
					),
			),
		},
	},
	play: async ({ args, canvas }) => {
		await waitFor(() =>
			expect(
				canvas.getByRole("button", { name: /フィードを取得中/u }),
			).toBeDisabled(),
		);
		await expect(
			canvas.getByRole("button", { name: /フィードを取得中/u }),
		).toHaveTextContent("0 / 1");
		await expect(
			canvas.queryByText("フィードを取得中"),
		).not.toBeInTheDocument();
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
		await userEvent.click(
			canvas.getByRole("button", { name: "あとで読むに保存" }),
		);
		await expect(args.services.saveRss).toHaveBeenCalled();
		await userEvent.click(
			canvas.getByRole("button", { name: "すべて既読にする" }),
		);
		await expect(args.services.markRssRead).toHaveBeenCalledWith({
			before: expect.any(String),
		});
	},
};

export const BackgroundReadPending: Story = {
	args: {
		initialData: { ...page, unreadCount: 51 },
		services: {
			...services,
			loadRss: fn(() => new Promise<RssPage>(() => {})),
		},
	},
	play: async ({ args, canvas }) => {
		// The initial poll finishes and starts a background page read that never resolves.
		await waitFor(() => expect(args.services.loadRss).toHaveBeenCalledTimes(2));
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
		await userEvent.click(canvas.getByRole("button", { name: "次へ" }));
		await waitFor(() =>
			expect(args.services.loadRss).toHaveBeenCalledWith(50, undefined),
		);
		// A foreground page change still prevents duplicate page navigation.
		await expect(canvas.getByRole("button", { name: "次へ" })).toBeDisabled();
		await expect(canvas.getByRole("status")).toHaveAccessibleName(
			"読み込み中…",
		);
	},
};

export const SubscriptionStartsRefresh: Story = {
	args: {
		view: "feeds",
		initialData: empty,
		services: {
			...services,
			refreshRss: fn(() => new Promise<{ data: [] }>(() => {})),
		},
	},
	play: async ({ args, canvas }) => {
		await userEvent.type(
			canvas.getByLabelText("フィードURL"),
			"https://example.com/feed",
		);
		await userEvent.click(canvas.getByRole("button", { name: "購読する" }));
		await waitFor(() =>
			expect(args.services.refreshRss).toHaveBeenCalledWith([feedId], false),
		);
		await expect(
			canvas.getByRole("button", { name: /フィードを取得中/u }),
		).toBeDisabled();
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "購読する" })).toBeEnabled(),
		);
		await expect(canvas.getByLabelText("取り込みファイル")).toBeEnabled();
		await expect(
			canvas.getByRole("button", { name: "購読解除" }),
		).toBeEnabled();
	},
};

// The first feed stays pending while every other feed finishes, including those beyond slot five.
const parallelFeeds = Array.from({ length: 7 }, (_, index) => ({
	...page.feeds[0],
	id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
	title: `購読 ${index + 1}`,
}));
const parallelPage = { ...page, feeds: parallelFeeds };
const parallelRefresh = fn(async ([id]: string[]) => {
	if (id === feedId) return new Promise<{ data: [] }>(() => {});
	return { data: [{ id, status: "updated" as const }] };
});
export const ProgressiveRefresh: Story = {
	args: {
		initialData: parallelPage,
		services: {
			...services,
			refreshRss: parallelRefresh,
			loadRss: fn(async () => ({
				...parallelPage,
				unread: [
					{
						...page.unread[0],
						title:
							parallelRefresh.mock.calls.length === 7
								? "速い購読の新着記事"
								: "RSSを軽量に読む",
					},
				],
			})),
		},
	},
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(parallelRefresh).toHaveBeenCalledWith(
				[parallelFeeds[6].id],
				false,
			),
		);
		await expect(
			await canvas.findByRole("button", { name: "フィードを取得中 6 / 7" }),
		).toBeVisible();
		await waitFor(
			() =>
				expect(
					canvas.getByRole("link", { name: "速い購読の新着記事" }),
				).toBeVisible(),
			{ timeout: 3000 },
		);
		await expect(
			canvas.getByRole("button", { name: /フィードを取得中/u }),
		).toBeDisabled();
	},
};

const longFeedTitle =
	"とても長い購読名とフォルダー名を持つフィードのモバイル表示を確認するための記事一覧";
const narrowPage = {
	...page,
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
			expect(args.services.loadRss).toHaveBeenCalledWith(0, feedId),
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
			refreshRss: fn(() => new Promise<{ data: [] }>(() => {})),
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
			refreshRss: fn(() => new Promise<{ data: [] }>(() => {})),
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
