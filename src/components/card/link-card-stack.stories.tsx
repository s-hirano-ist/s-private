import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LinkCardStack } from "./link-card-stack";

const meta = {
	component: LinkCardStack,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof LinkCardStack>;

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
	args: {
		data: mockData,
		showDeleteButton: false,
	},
};

export const WithDeleteButton: Story = {
	args: {
		data: mockData,
		showDeleteButton: true,
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		showDeleteButton: false,
	},
};

export const SingleItem: Story = {
	args: {
		data: [mockData[0]],
		showDeleteButton: false,
	},
};

export const ManyItems: Story = {
	args: {
		data: [
			...mockData,
			{
				id: 4,
				title: "Fourth News Item",
				description: "This is the fourth news item to test grid layout.",
				href: "https://example.com/4",
				badgeText: "Sports",
			},
			{
				id: 5,
				title: "Fifth News Item",
				description:
					"This is the fifth news item with a longer description to test text truncation and wrapping behavior.",
				href: "https://example.com/5",
			},
		],
		showDeleteButton: false,
	},
};
