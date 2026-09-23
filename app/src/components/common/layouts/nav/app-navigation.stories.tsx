import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { AppNavigation } from "./app-navigation";

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
		await expect(canvas.getByRole("link", { name: "未公開" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await within(document.body).findByRole("dialog");
		const form = within(dialog).getByText("Article form");
		await waitFor(() => expect(form).toBeVisible());
	},
};

export const ExportedBooks: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/books/viewer" } } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("link", { name: "公開済み" }),
		).toHaveAttribute("aria-current", "page");
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
