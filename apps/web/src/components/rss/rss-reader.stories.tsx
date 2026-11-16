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
		await userEvent.click(canvas.getByRole("button", { name: "既読にする" }));
		await expect(services.markRssRead).toHaveBeenCalledWith({ ids: [entryId] });
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
		initialView: "saved",
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
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: /購読管理/u }));
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
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(
				canvas.getByRole("button", { name: "フィードを取得中" }),
			).toBeDisabled(),
		);
		await expect(
			canvas.getByRole("link", { name: "RSSを軽量に読む" }),
		).toBeVisible();
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
			await canvas.findByText("フィードを取得中 6 / 7"),
		).toBeVisible();
		await waitFor(
			() =>
				expect(
					canvas.getByRole("link", { name: "速い購読の新着記事" }),
				).toBeVisible(),
			{ timeout: 3000 },
		);
		await expect(
			canvas.getByRole("button", { name: "フィードを取得中" }),
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
