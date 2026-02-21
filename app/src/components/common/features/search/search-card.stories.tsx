import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
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
		a11y: { disable: true },
	},
} satisfies Meta<typeof SearchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { search: fn() },
};

export const WithArticleResults: Story = {
	args: { search: fn().mockResolvedValue(mockArticleResults) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "typescript{Enter}");
	},
};

export const WithNonArticleResults: Story = {
	args: { search: fn().mockResolvedValue(mockNonArticleResults) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "clean{Enter}");
	},
};

export const EmptyResults: Story = {
	args: { search: fn().mockResolvedValue(mockEmptyResults) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "nothing{Enter}");
	},
};

export const ErrorState: Story = {
	args: { search: fn().mockResolvedValue(mockErrorResult) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "error{Enter}");
	},
};
