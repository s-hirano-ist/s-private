import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { AppNavigation } from "./app-navigation";
import { ViewerCountProvider, ViewerCountSync } from "./viewer-count-context";

const meta = {
	component: AppNavigation,
	args: {
		forms: {
			articles: <div>Article form</div>,
			books: <div>Book form</div>,
			images: <div>Image form</div>,
			notes: <div>Note form</div>,
		},
		search: fn(),
	},
	parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
	decorators: [
		(Story) => (
			<ViewerCountProvider>
				<Story />
			</ViewerCountProvider>
		),
	],
} satisfies Meta<typeof AppNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnexportedArticles: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/articles" } } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("navigation", { name: "コンテンツの種類" }),
		).toBeVisible();
		await expect(
			canvas.getByRole("link", {
				name: "公開状態: 未公開。公開済みに切り替え",
			}),
		).toHaveAttribute("href", "/ja/articles/viewer");
		await expect(
			canvas.queryByRole("heading", { name: "記事" }),
		).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await within(document.body).findByRole("dialog");
		const form = within(dialog).getByText("Article form");
		await waitFor(() => expect(form).toBeVisible());
	},
};

export const ExportedBooks: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/books/viewer" } } },
	render: (args) => (
		<>
			<AppNavigation {...args} />
			<ViewerCountSync count={42} domain="books" />
		</>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() =>
			expect(
				canvas.getByRole("link", {
					name: "公開状態: 公開済み。未公開に切り替え（42件）",
				}),
			).toHaveAttribute("href", "/ja/books"),
		);
		const tabs = within(
			canvas.getByRole("navigation", { name: "コンテンツの種類" }),
		);
		await expect(tabs.getByRole("link", { name: "記事" })).toHaveAttribute(
			"href",
			"/ja/articles/viewer",
		);
	},
};

export const Settings: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/settings" } } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("heading", { name: "設定" })).toBeVisible();
		await expect(
			canvas.queryByRole("button", { name: "新規作成" }),
		).not.toBeInTheDocument();
	},
};

export const DarkUnexportedArticles: Story = {
	globals: {
		backgrounds: { value: "black" },
		theme: "dark",
	},
	parameters: {
		nextjs: { navigation: { pathname: "/ja/articles" } },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("navigation", { name: "コンテンツの種類" }),
		).toBeVisible();
		await expect(
			canvas.getByRole("link", {
				name: "公開状態: 未公開。公開済みに切り替え",
			}),
		).toHaveAttribute("href", "/ja/articles/viewer");
	},
};

export const CompactMobileArticles: Story = {
	globals: { viewport: { value: "mobile1" } },
	decorators: [
		(Story) => (
			<div className="w-[280px] max-w-full">
				<Story />
			</div>
		),
	],
	parameters: { nextjs: { navigation: { pathname: "/ja/articles" } } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const header = canvas.getByRole("banner");
		await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
		await expect(header.getBoundingClientRect().height).toBeLessThanOrEqual(56);
		await expect(
			canvas.getByRole("link", {
				name: "公開状態: 未公開。公開済みに切り替え",
			}),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: "新規作成" }),
		).toBeVisible();
		await expect(canvas.getByRole("button", { name: "検索" })).toBeVisible();
		await expect(canvas.getByRole("link", { name: "設定" })).toBeVisible();
	},
};
