import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import type { SearchResult } from "@/features/ai/actions/ai-search";
import { SearchResults } from "./search-results";

const meta = {
	title: "Features/AI/SearchResults",
	component: SearchResults,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof SearchResults>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockResults: SearchResult[] = [
	{
		id: "1",
		title: "Introduction to React",
		content: "React is a JavaScript library for building user interfaces...",
		aiSummary:
			"This content covers the basics of React including components, state, and props.",
		type: "content",
		relevanceScore: 0.95,
	},
	{
		id: "2",
		title: "Advanced TypeScript Patterns",
		content: "TypeScript provides powerful type system features...",
		aiSummary:
			"Learn about advanced TypeScript patterns including conditional types, mapped types, and utility types.",
		type: "book",
		relevanceScore: 0.87,
	},
	{
		id: "3",
		title: "Modern Web Development",
		content: "Web development has evolved significantly...",
		aiSummary:
			"This book covers modern web development practices including responsive design, performance optimization, and accessibility.",
		type: "book",
		relevanceScore: 0.72,
	},
];

export const Default: Story = {
	args: {
		results: mockResults,
		isLoading: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};

export const Loading: Story = {
	args: {
		results: [],
		isLoading: true,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};

export const NoResults: Story = {
	args: {
		results: [],
		isLoading: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};

export const SingleResult: Story = {
	args: {
		results: [mockResults[0]],
		isLoading: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};

export const ContentOnly: Story = {
	args: {
		results: [mockResults[0]],
		isLoading: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};

export const BookOnly: Story = {
	args: {
		results: [mockResults[1]],
		isLoading: false,
	},
	render: (args) => {
		return (
			<NextIntlClientProvider locale="ja">
				<SearchResults isLoading={args.isLoading} results={args.results} />
			</NextIntlClientProvider>
		);
	},
};
