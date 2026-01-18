import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ArticleForm } from "./article-form";

const meta = {
	component: ArticleForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
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
