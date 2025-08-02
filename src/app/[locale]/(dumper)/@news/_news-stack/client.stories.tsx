import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { NewsStackClient } from "./client";

const meta = {
	component: NewsStackClient,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof NewsStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: 1,
		title: "First News Item",
		quote: "This is the first news item with a quote.",
		url: "https://example.com/1",
		category: "Tech",
	},
	{
		id: 2,
		title: "Second News Item",
		quote: "This is the second news item.",
		url: "https://example.com/2",
		category: "News",
	},
	{
		id: 3,
		title: "Third News Item",
		quote: null,
		url: "https://example.com/3",
		category: "General",
	},
];

export const Default: Story = {
	args: { cardStackData: mockData, deleteNews: fn() },
};
