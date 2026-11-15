import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
		await userEvent.click(
			canvas.getByRole("button", { name: /あとで読む 1/u }),
		);
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
