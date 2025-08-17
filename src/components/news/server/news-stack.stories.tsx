import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { NewsStack, Props as NewsStackProps } from "./news-stack";

function NewsStackWrapper({
	getNews,
	deleteNews,
	loadMoreAction,
}: NewsStackProps) {
	return (
		<Suspense>
			<NewsStack
				deleteNews={deleteNews}
				getNews={getNews}
				loadMoreAction={loadMoreAction}
			/>
		</Suspense>
	);
}

const meta = {
	component: NewsStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		getNews: { action: "getNews" },
		deleteNews: { action: "deleteNews" },
		loadMoreAction: { action: "loadMoreAction" },
	},
} satisfies Meta<typeof NewsStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGetNews = async () => ({
	data: [
		{
			id: "1",
			key: "tech-news-1",
			title: "New TypeScript Features Released",
			description:
				"TypeScript 5.3 brings exciting new features including better type inference and performance improvements.",
			primaryBadgeText: "Technology",
			secondaryBadgeText: "Featured",
			href: "https://example.com/typescript-news",
		},
		{
			id: "2",
			key: "tech-news-2",
			title: "React 18 Best Practices",
			description:
				"Learn about the latest best practices for React 18 including concurrent features and Suspense.",
			primaryBadgeText: "React",
			href: "https://example.com/react-news",
		},
		{
			id: "3",
			key: "tech-news-3",
			title: "Web Performance Optimization Tips",
			description: "Essential tips for optimizing web performance in 2024.",
			primaryBadgeText: "Performance",
			secondaryBadgeText: "Guide",
			href: "https://example.com/performance-tips",
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
		getNews: mockGetNews,
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		getNews: mockGetNews,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		getNews: mockGetNews,
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const SingleItem: Story = {
	args: {
		getNews: mockGetNews,
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithInfiniteScroll: Story = {
	args: {
		getNews: mockGetNews,
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: [
					{
						id: "4",
						key: "loaded-news",
						title: "Loaded News Item",
						description: "This was loaded via infinite scroll",
						primaryBadgeText: "Loaded",
						href: "https://example.com/loaded-news",
					},
				],
				totalCount: 100,
			},
		}),
	},
};
