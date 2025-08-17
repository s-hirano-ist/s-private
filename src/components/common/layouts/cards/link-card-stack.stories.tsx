import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
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
		id: "1",
		key: "1",
		title: "First News Item",
		description: "This is the first news item.",
		href: "https://example.com/1",
		primaryBadgeText: "Tech",
		secondaryBadgeText: "example.com",
	},
	{
		id: "2",
		key: "2",
		title: "Second News Item",
		description: "This is the second news item.",
		href: "https://example.com/2",
		primaryBadgeText: "Tech",
		secondaryBadgeText: "example.com",
	},
	{
		id: "3",
		key: "3",
		title: "Third News Item",
		href: "https://example.com/3",
		primaryBadgeText: "Tech",
		secondaryBadgeText: "example.com",
	},
];

const mockLoadMoreAction = async () => ({
	success: true,
	message: "success",
	data: {
		data: [],
		totalCount: 1,
	},
});

export const Default: Story = {
	args: {
		initial: { data: mockData, totalCount: 100 },
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithDeleteButton: Story = {
	args: {
		initial: { data: mockData, totalCount: 100 },
		loadMoreAction: mockLoadMoreAction,
		deleteAction: fn(),
	},
};

export const EmptyData: Story = {
	args: {
		initial: { data: mockData, totalCount: 100 },
		loadMoreAction: mockLoadMoreAction,
	},
};

export const SingleItem: Story = {
	args: {
		initial: { data: mockData, totalCount: 100 },
		loadMoreAction: mockLoadMoreAction,
	},
};

export const ManyItems: Story = {
	args: {
		initial: {
			data: [
				...mockData,
				{
					id: "4",
					key: "4",
					title: "Fourth News Item",
					description: "This is the fourth news item to test grid layout.",
					href: "https://example.com/4",
					primaryBadgeText: "Tech",
					secondaryBadgeText: "example.com",
				},
				{
					id: "5",
					key: "5",
					title: "Fifth News Item",
					description:
						"This is the fifth news item with a longer description to test text truncation and wrapping behavior.",
					href: "https://example.com/5",
				},
			],
			totalCount: 100,
		},
		loadMoreAction: mockLoadMoreAction,
	},
};
