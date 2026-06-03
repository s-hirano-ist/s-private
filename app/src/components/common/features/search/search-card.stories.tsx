import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SearchCard } from "./search-card";

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

const meta = {
	component: SearchCard,
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
	args: { search: fn().mockResolvedValue(mockArticleResults) },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "typescript{Enter}");
	},
};

// Wraps SearchCard in a bounded flex column to emulate the drawer popup
// (flex flex-col + max-height + overflow-hidden), so the single scrollable
// results region can be verified outside of an actual Drawer. Guards against
// the regression where article results rendered outside the scrollable region
// and could not be scrolled to inside the mobile drawer.
export const WithManyArticleResultsScrollable: Story = {
	args: { search: fn() },
	parameters: { a11y: { disable: true } },
	decorators: [
		(Story) => (
			<div className="flex h-[400px] w-80 flex-col overflow-hidden rounded-lg border">
				<Story />
			</div>
		),
	],
	play: async ({ args, canvasElement }) => {
		// Set the resolved value inside play: Storybook resets `fn()` spies before
		// each story, which would otherwise clear an args-level mockResolvedValue.
		(args.search as ReturnType<typeof fn>).mockResolvedValue(
			mockManyArticleResults,
		);

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
	args: { search: fn().mockResolvedValue(mockNonArticleResults) },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "clean{Enter}");
	},
};

export const EmptyResults: Story = {
	args: { search: fn().mockResolvedValue(mockEmptyResults) },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "nothing{Enter}");
	},
};

export const ErrorState: Story = {
	args: { search: fn().mockResolvedValue(mockErrorResult) },
	parameters: { a11y: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "error{Enter}");
	},
};
