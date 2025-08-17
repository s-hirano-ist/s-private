import type { Meta, StoryObj } from "@storybook/react";
import { ContentsStack, Props as ContentsStackProps } from "./contents-stack";

function ContentsStackWrapper({
	getContents,
	deleteContents,
	loadMoreAction,
}: ContentsStackProps) {
	return (
		<ContentsStack
			deleteContents={deleteContents}
			getContents={getContents}
			loadMoreAction={loadMoreAction}
		/>
	);
}

const meta = {
	component: ContentsStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		getContents: { action: "getContents" },
		deleteContents: { action: "deleteContents" },
		loadMoreAction: { action: "loadMoreAction" },
	},
} satisfies Meta<typeof ContentsStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGetContents = async () => ({
	data: [
		{
			id: "1",
			key: "content-guide-1",
			title: "Getting Started with TypeScript",
			description:
				"A comprehensive guide to getting started with TypeScript for beginners. Learn the basics of type annotations, interfaces, and more.",
			primaryBadgeText: "Guide",
			secondaryBadgeText: "TypeScript",
			href: "/content/getting-started-typescript",
		},
		{
			id: "2",
			key: "content-tutorial-2",
			title: "Advanced React Patterns",
			description:
				"Explore advanced React patterns including render props, higher-order components, and custom hooks.",
			primaryBadgeText: "Tutorial",
			secondaryBadgeText: "React",
			href: "/content/advanced-react-patterns",
		},
		{
			id: "3",
			key: "content-reference-3",
			title: "JavaScript ES2024 Features",
			description:
				"Overview of the latest JavaScript features introduced in ES2024.",
			primaryBadgeText: "Reference",
			href: "/content/javascript-es2024-features",
		},
		{
			id: "4",
			key: "content-cheatsheet-4",
			title: "CSS Grid Cheat Sheet",
			description: "Quick reference for CSS Grid layout properties and values.",
			primaryBadgeText: "Cheat Sheet",
			secondaryBadgeText: "CSS",
			href: "/content/css-grid-cheatsheet",
		},
	],
	totalCount: 100,
});

const mockLoadMoreAction = async () => ({
	success: true,
	message: "success",
	data: {
		data: [],
		totalCount: 100,
	},
});

export const Default: Story = {
	args: {
		getContents: mockGetContents,
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		getContents: mockGetContents,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		getContents: mockGetContents,
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const SingleItem: Story = {
	args: {
		getContents: mockGetContents,
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithInfiniteScroll: Story = {
	args: {
		getContents: mockGetContents,
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: [
					{
						id: "5",
						key: "loaded-content",
						title: "Loaded Content Item",
						description: "This was loaded via infinite scroll",
						primaryBadgeText: "Loaded",
						href: "/content/loaded-item",
					},
				],
				totalCount: 100,
			},
		}),
	},
};
