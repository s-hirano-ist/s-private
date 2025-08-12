import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContentsStackClient } from "./client";

const meta = {
	component: ContentsStackClient,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof ContentsStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: 1,
		title: "First News Item",
		description: "This is the first news item.",
		href: "https://example.com/1",
		badgeText: "Tech",
	},
	{
		id: 2,
		title: "Second News Item",
		description: "This is the second news item.",
		href: "https://example.com/2",
		badgeText: "News",
	},
	{
		id: 3,
		title: "Third News Item",
		href: "https://example.com/3",
		badgeText: "General",
	},
];

export const Default: Story = {
	args: { data: mockData },
};
