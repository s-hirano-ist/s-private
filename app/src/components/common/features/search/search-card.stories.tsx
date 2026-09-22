import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SearchCard } from "./search-card";

const pendingSearch: typeof searchContentFromClient = () =>
	new Promise<never>(() => {});

const mockArticleResults = {
	success: true as const,
	message: "success",
	data: {
		results: [
			{
				href: "https://example.com/article-1",
				contentType: "articles" as const,
				title: "TypeScript Best Practices",
				snippet: "Learn about TypeScript best practices...",
				url: "https://example.com/article-1",
				category: { id: "tech", name: "Technology" },
			},
			{
				href: "https://example.com/article-2",
				contentType: "articles" as const,
				title: "React Performance Tips",
				snippet: "Optimize your React application...",
				url: "https://example.com/article-2",
				category: { id: "react", name: "React" },
			},
		],
		groups: [],
		totalCount: 2,
		query: "typescript",
	},
};

const mockManyArticleResults = {
	success: true as const,
	message: "success",
	data: {
		results: Array.from({ length: 20 }, (_, index) => ({
			href: `https://example.com/article-${index + 1}`,
			contentType: "articles" as const,
			title: `TypeScript Article #${index + 1}`,
			snippet: `Snippet describing the contents of article number ${index + 1}...`,
			url: `https://example.com/article-${index + 1}`,
			category: { id: "tech", name: "Technology" },
		})),
		groups: [],
		totalCount: 20,
		query: "typescript",
	},
};

const mockNonArticleResults = {
	success: true as const,
	message: "success",
	data: {
		results: [
			{
				href: "book-123",
				contentType: "books" as const,
				title: "Clean Code",
				snippet: "A handbook of agile software craftsmanship...",
				rating: 5,
				tags: ["programming"],
			},
			{
				href: "note-456",
				contentType: "notes" as const,
				title: "Meeting Notes",
				snippet: "Discussion about project timeline...",
			},
		],
		groups: [],
		totalCount: 2,
		query: "clean",
	},
};

const mockEmptyResults = {
	success: true as const,
	message: "success",
	data: { results: [], groups: [], totalCount: 0, query: "nothing" },
};

const mockErrorResult = {
	success: false as const,
	message: "Search failed",
};

const searchWithArticleResults: typeof searchContentFromClient = async () =>
	mockArticleResults;
const searchWithManyArticleResults: typeof searchContentFromClient = async () =>
	mockManyArticleResults;
const searchWithNonArticleResults: typeof searchContentFromClient = async () =>
	mockNonArticleResults;
const searchWithEmptyResults: typeof searchContentFromClient = async () =>
	mockEmptyResults;
const searchWithError: typeof searchContentFromClient = async () =>
	mockErrorResult;

const meta = {
	component: SearchCard,
	args: {
		publicKey: "test-public-key",
		sendTestPush: fn().mockResolvedValue({ message: "success", success: true }),
		subscribeToPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
		unsubscribeFromPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
	},
	parameters: {
		layout: "centered",
		nextjs: {
			navigation: { pathname: "/en" },
		},
	},
} satisfies Meta<typeof SearchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { search: fn() },
};

export const WithArticleResults: Story = {
	args: { search: searchWithArticleResults },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "typescript");
		await userEvent.click(canvas.getByRole("button", { name: "検索" }));
		await expect(
			await canvas.findByText("TypeScript Best Practices"),
		).toBeVisible();
		await expect(
			canvas.getByText("Learn about TypeScript best practices..."),
		).toBeVisible();
		await expect(
			canvas.getByRole("link", { name: /TypeScript Best Practices/u }),
		).toHaveAttribute("href", "https://example.com/article-1");
		await expect(canvas.queryByText("500")).not.toBeInTheDocument();
	},
};

// Wraps SearchCard in a bounded flex column to emulate the drawer popup
// (flex flex-col + max-height + overflow-hidden), so the single scrollable
// results region can be verified outside of an actual Drawer. Guards against
// the regression where article results rendered outside the scrollable region
// and could not be scrolled to inside the mobile drawer.
export const WithManyArticleResultsScrollable: Story = {
	args: { search: searchWithManyArticleResults },
	parameters: { a11y: { disable: true } },
	decorators: [
		(Story) => (
			<div className="flex h-[400px] w-80 flex-col overflow-hidden rounded-lg border">
				<Story />
			</div>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "typescript{Enter}");

		// The last article must be rendered inside the single scroll container,
		// and that container must actually overflow (scrollHeight > clientHeight)
		// so the results can be scrolled.
		const lastArticle = await canvas.findByText("TypeScript Article #20");
		let scrollContainer: HTMLElement | null = lastArticle;
		while (
			scrollContainer &&
			getComputedStyle(scrollContainer).overflowY !== "auto"
		) {
			scrollContainer = scrollContainer.parentElement;
		}
		expect(scrollContainer).not.toBeNull();
		expect(scrollContainer?.scrollHeight ?? 0).toBeGreaterThan(
			scrollContainer?.clientHeight ?? 0,
		);
	},
};

export const WithNonArticleResults: Story = {
	args: { search: searchWithNonArticleResults },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "clean{Enter}");
		await expect(await canvas.findByText("Clean Code")).toBeVisible();
		await expect(
			canvas.getByRole("link", { name: /Clean Code/u }),
		).toHaveAttribute("href", "/ja/book/book-123");
		await expect(
			canvas.getByRole("link", { name: /Meeting Notes/u }),
		).toHaveAttribute("href", "/ja/note/note-456");
	},
};

export const EmptyResults: Story = {
	args: { search: searchWithEmptyResults },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "nothing{Enter}");
		await expect(await canvas.findByText("204")).toBeInTheDocument();
	},
};

export const ErrorState: Story = {
	args: { search: searchWithError },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "error{Enter}");
		await expect(await canvas.findByText("500")).toBeInTheDocument();
	},
};

export const Loading: Story = {
	args: { search: fn(pendingSearch) },
	parameters: { a11y: { disable: true } },
	play: async ({ args, canvasElement }) => {
		(args.search as ReturnType<typeof fn>).mockImplementation(pendingSearch);
		const canvas = within(canvasElement);
		await userEvent.type(canvas.getByRole("textbox"), "loading{Enter}");
		await expect(await canvas.findByRole("status")).toBeVisible();
	},
};
