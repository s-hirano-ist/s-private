import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Dialog, DialogContent, DialogTitle } from "@s-hirano-ist/s-ui/dialog";
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
		addArticle: fn(),
		getCategories: fn(async () => mockCategories),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const categoryTrigger = canvas.getByRole("combobox", {
			name: "カテゴリー",
		});

		expect(args.getCategories).not.toHaveBeenCalled();
		await userEvent.click(categoryTrigger);

		const body = within(canvasElement.ownerDocument.body);
		await expect(body.findByText("Technology")).resolves.toBeVisible();
		expect(args.getCategories).toHaveBeenCalledTimes(1);

		await userEvent.click(categoryTrigger);
		await userEvent.click(categoryTrigger);
		expect(args.getCategories).toHaveBeenCalledTimes(1);
	},
};

export const InMobileCreateDialog: Story = {
	args: {
		addArticle: fn(),
		getCategories: fn(async () => mockCategories),
	},
	globals: { viewport: { value: "mobile1" } },
	render: (args) => (
		<Dialog defaultOpen>
			<DialogContent className="max-h-[85dvh] overflow-y-auto">
				<DialogTitle>Create article</DialogTitle>
				<ArticleForm {...args} />
			</DialogContent>
		</Dialog>
	),
	play: async ({ args, canvasElement }) => {
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(body.getByRole("combobox", { name: "カテゴリー" }));
		await expect(body.findByText("Technology")).resolves.toBeVisible();
		await userEvent.click(body.getByText("Technology"));
		await expect(
			body.getByRole("combobox", { name: "カテゴリー" }),
		).toHaveTextContent("Technology");
		expect(args.getCategories).toHaveBeenCalledTimes(1);
	},
};

const getSlowCategories = fn(async () => mockCategories);

export const LoadsCategoriesOnFirstOpen: Story = {
	args: {
		addArticle: fn(),
		getCategories: getSlowCategories,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		let resolveCategories:
			| ((categories: typeof mockCategories) => void)
			| undefined;

		getSlowCategories.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveCategories = resolve;
				}),
		);

		expect(getSlowCategories).not.toHaveBeenCalled();
		await userEvent.click(canvas.getByRole("combobox", { name: "カテゴリー" }));

		await expect(body.findByText("読み込み中...")).resolves.toBeVisible();
		expect(getSlowCategories).toHaveBeenCalledTimes(1);

		resolveCategories?.(mockCategories);
		await expect(body.findByText("Technology")).resolves.toBeVisible();
	},
};

export const WithManyCategories: Story = {
	args: {
		getCategories: fn(async () => [
			...mockCategories,
			{ id: "6", name: "Entertainment" },
			{ id: "7", name: "Politics" },
			{ id: "8", name: "World" },
			{ id: "9", name: "Local" },
			{ id: "10", name: "Opinion" },
		]),
		addArticle: fn(),
	},
};

export const EmptyCategories: Story = {
	args: {
		addArticle: fn(),
		getCategories: fn(async () => []),
	},
};

export const PasteUrl: Story = {
	args: {
		addArticle: fn(),
		getCategories: fn(async () => []),
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
		addArticle: fn(),
		getCategories: fn(async () => mockCategories),
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
