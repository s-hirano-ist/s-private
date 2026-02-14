import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ArticleForm } from "./article-form";

const meta = {
	component: ArticleForm,
	parameters: { layout: "centered" },
} satisfies Meta<typeof ArticleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCategories = [
	{ id: "1", name: "Technology" },
	{ id: "2", name: "Business" },
	{ id: "3", name: "Science" },
	{ id: "4", name: "Health" },
	{ id: "5", name: "Sports" },
];

export const Default: Story = {
	args: {
		categories: mockCategories,
		addArticle: fn(),
	},
};

export const WithManyCategories: Story = {
	args: {
		categories: [
			...mockCategories,
			{ id: "6", name: "Entertainment" },
			{ id: "7", name: "Politics" },
			{ id: "8", name: "World" },
			{ id: "9", name: "Local" },
			{ id: "10", name: "Opinion" },
		],
		addArticle: fn(),
	},
};

export const EmptyCategories: Story = {
	args: {
		categories: [],
		addArticle: fn(),
	},
};

export const PasteUrl: Story = {
	args: {
		categories: [],
		addArticle: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const clipboardText = "https://example.com";

		const originalClipboard = navigator.clipboard;
		const mockClipboard = { readText: fn().mockResolvedValue(clipboardText) };
		Object.defineProperty(navigator, "clipboard", {
			value: mockClipboard,
			writable: true,
			configurable: true,
		});

		const pasteButton = canvas.getByTestId("paste-button");
		await userEvent.click(pasteButton);

		await waitFor(() => {
			expect(canvas.getByRole("textbox", { name: "URL" })).toHaveValue(
				clipboardText,
			);
		});

		Object.defineProperty(navigator, "clipboard", {
			value: originalClipboard,
			writable: true,
			configurable: true,
		});
	},
};

export const FillForm: Story = {
	args: {
		categories: mockCategories,
		addArticle: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const titleInput = canvas.getByLabelText("タイトル");
		await userEvent.type(titleInput, "テスト記事タイトル");
		await expect(titleInput).toHaveValue("テスト記事タイトル");

		const quoteInput = canvas.getByLabelText("詳細");
		await userEvent.type(quoteInput, "テストの引用文");
		await expect(quoteInput).toHaveValue("テストの引用文");

		const urlInput = canvas.getByRole("textbox", { name: "URL" });
		await userEvent.type(urlInput, "https://example.com/test");
		await expect(urlInput).toHaveValue("https://example.com/test");
	},
};
