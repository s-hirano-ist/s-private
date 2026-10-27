import type { ServerAction } from "@/common/types";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleForm } from "@/components/articles/client/article-form";
import { BooksForm } from "@/components/books/client/books-form";
import { ImageForm } from "@/components/images/client/image-form";
import { NoteForm } from "@/components/notes/client/note-form";
import {
	expect,
	fireEvent,
	fn,
	userEvent,
	waitFor,
	within,
} from "storybook/test";
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

const addNoteSuccess = fn();

export const CreateNoteClosesWhileSaving: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/notes" } } },
	render: (args) => (
		<AppNavigation
			{...args}
			forms={{ ...args.forms, notes: <NoteForm addNote={addNoteSuccess} /> }}
		/>
	),
	play: async ({ canvasElement }) => {
		let complete: ((response: ServerAction) => void) | undefined;
		addNoteSuccess.mockImplementationOnce(
			() =>
				new Promise<ServerAction>((resolve) => {
					complete = resolve;
				}),
		);
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await body.findByRole("dialog");
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "タイトル" }),
			"新しいメモ",
		);
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "詳細" }),
			"本文",
		);
		await userEvent.click(within(dialog).getByRole("button", { name: "保存" }));
		await waitFor(() =>
			expect(
				body.queryByRole("dialog", { name: "新規作成" }),
			).not.toBeInTheDocument(),
		);
		await expect(canvas.getByRole("button", { name: "検索" })).toBeEnabled();
		complete?.({ success: true, message: "inserted" });
		await waitFor(() =>
			expect(body.getByText("正常に登録されました。")).toBeVisible(),
		);
	},
};

const addNoteFailure = fn();

export const CreateNoteReopensWithDraft: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/notes" } } },
	render: (args) => (
		<AppNavigation
			{...args}
			forms={{ ...args.forms, notes: <NoteForm addNote={addNoteFailure} /> }}
		/>
	),
	play: async ({ canvasElement }) => {
		addNoteFailure.mockResolvedValueOnce({
			success: false,
			message: "duplicated",
		});
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await body.findByRole("dialog");
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "タイトル" }),
			"保持する題名",
		);
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "詳細" }),
			"保持する本文",
		);
		await userEvent.click(within(dialog).getByRole("button", { name: "保存" }));
		const reopened = await body.findByRole("dialog", { name: "新規作成" });
		await expect(
			within(reopened).getByRole("textbox", { name: "タイトル" }),
		).toHaveValue("保持する題名");
		await expect(
			within(reopened).getByRole("textbox", { name: "詳細" }),
		).toHaveValue("保持する本文");
		await waitFor(() =>
			expect(
				body.getByText("すでに登録されているため登録できません。"),
			).toBeVisible(),
		);
	},
};

const addArticleFailure = fn();

export const CreateArticleRetainsCategoryOnFailure: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/articles" } } },
	render: (args) => (
		<AppNavigation
			{...args}
			forms={{
				...args.forms,
				articles: (
					<ArticleForm
						addArticle={addArticleFailure}
						getCategories={fn().mockResolvedValue([
							{ id: "1", name: "Technology" },
						])}
					/>
				),
			}}
		/>
	),
	play: async ({ canvasElement }) => {
		addArticleFailure.mockResolvedValueOnce({
			success: false,
			message: "duplicated",
		});
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await body.findByRole("dialog", { name: "新規作成" });
		await userEvent.click(
			within(dialog).getByRole("combobox", { name: "カテゴリー" }),
		);
		await userEvent.click(await body.findByText("Technology"));
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "タイトル" }),
			"記事タイトル",
		);
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "URL" }),
			"https://example.com",
		);
		await userEvent.click(within(dialog).getByRole("button", { name: "保存" }));
		await waitFor(() =>
			expect(
				body.getByText("すでに登録されているため登録できません。"),
			).toBeVisible(),
		);
		const reopened = body.getByRole("dialog", { name: "新規作成" });
		await expect(
			within(reopened).getByRole("combobox", { name: "カテゴリー" }),
		).toHaveTextContent("Technology");
		await expect(
			within(reopened).getByRole("textbox", { name: "タイトル" }),
		).toHaveValue("記事タイトル");
		await expect(
			within(reopened).getByRole("textbox", { name: "URL" }),
		).toHaveValue("https://example.com");
	},
};

const addBooksFailure = fn();

export const CreateBookRetainsCoverOnFailure: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/books" } } },
	render: (args) => (
		<AppNavigation
			{...args}
			forms={{ ...args.forms, books: <BooksForm addBooks={addBooksFailure} /> }}
		/>
	),
	play: async ({ canvasElement }) => {
		addBooksFailure.mockResolvedValueOnce({ success: false, message: "error" });
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await body.findByRole("dialog");
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "ISBN" }),
			"9784774189673",
		);
		await userEvent.type(
			within(dialog).getByRole("textbox", { name: "タイトル" }),
			"本の題名",
		);
		await userEvent.type(
			within(dialog).getByRole("spinbutton", { name: "評価 (1-5)" }),
			"4",
		);
		const coverInput =
			within(dialog).getByLabelText<HTMLInputElement>(/書籍画像/u);
		await userEvent.upload(
			coverInput,
			new File(["cover"], "cover.png", { type: "image/png" }),
		);
		await expect(coverInput.files?.[0]?.name).toBe("cover.png");
		const bookForm = within(dialog)
			.getByRole("button", { name: "保存" })
			.closest("form");
		if (bookForm) fireEvent.submit(bookForm);
		await waitFor(() => expect(addBooksFailure).toHaveBeenCalledTimes(1));
		const submittedBook = addBooksFailure.mock.calls[0]?.[0] as FormData;
		await expect((submittedBook.get("image") as File).name).toBe("cover.png");
		await waitFor(() => expect(body.getByText("cover.png")).toBeVisible());
		const reopened = body.getByRole("dialog", { name: "新規作成" });
		await expect(
			within(reopened).getByRole("textbox", { name: "タイトル" }),
		).toHaveValue("本の題名");
	},
};

const addImagesPartial = fn();

export const CreateImagesRetriesOnlyFailedFile: Story = {
	parameters: { nextjs: { navigation: { pathname: "/ja/images" } } },
	render: (args) => (
		<AppNavigation
			{...args}
			forms={{
				...args.forms,
				images: <ImageForm addImage={addImagesPartial} />,
			}}
		/>
	),
	play: async ({ canvasElement }) => {
		addImagesPartial
			.mockResolvedValueOnce({ success: true, message: "inserted" })
			.mockResolvedValueOnce({ success: false, message: "storageError" })
			.mockResolvedValueOnce({ success: true, message: "inserted" });
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole("button", { name: "新規作成" }));
		const dialog = await body.findByRole("dialog");
		const imageInput = within(dialog).getByLabelText<HTMLInputElement>("画像");
		await userEvent.upload(imageInput, [
			new File(["first"], "first.png", { type: "image/png" }),
			new File(["second"], "second.png", { type: "image/png" }),
		]);
		await expect(imageInput.files).toHaveLength(2);
		const imageForm = within(dialog)
			.getByRole("button", { name: "アップロード" })
			.closest("form");
		if (imageForm) fireEvent.submit(imageForm);
		await waitFor(() => expect(addImagesPartial).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(body.getByText("second.png")).toBeVisible());
		const reopened = body.getByRole("dialog", { name: "新規作成" });
		await userEvent.click(
			within(reopened).getByRole("button", { name: "アップロード" }),
		);
		await waitFor(() => expect(addImagesPartial).toHaveBeenCalledTimes(3));
		const retried = addImagesPartial.mock.calls[2]?.[0] as FormData;
		await expect((retried.get("file") as File).name).toBe("second.png");
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
