import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	ArticlesStack,
	type Props as ArticlesStackProps,
} from "./articles-stack";

function ArticlesStackWrapper({
	initialData,
	deleteAction,
	loadMoreAction,
}: ArticlesStackProps) {
	return (
		<ArticlesStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}

const meta = {
	component: ArticlesStackWrapper,
	parameters: { layout: "padded" },
	argTypes: {
		deleteAction: { action: "deleteAction" },
		loadMoreAction: { action: "loadMoreAction" },
	},
} satisfies Meta<typeof ArticlesStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

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
		initialData: {
			data: [
				{
					id: "1",
					key: "tech-articles-1",
					title: "New TypeScript Features Released",
					description:
						"TypeScript 5.3 brings exciting new features including better type inference and performance improvements.",
					primaryBadgeText: "Technology",
					secondaryBadgeText: "Featured",
					href: "https://example.com/typescript-article",
				},
				{
					id: "2",
					key: "tech-articles-2",
					title: "React 18 Best Practices",
					description:
						"Learn about the latest best practices for React 18 including concurrent features and Suspense.",
					primaryBadgeText: "React",
					href: "https://example.com/react-article",
				},
				{
					id: "3",
					key: "tech-articles-3",
					title: "Web Performance Optimization Tips",
					description: "Essential tips for optimizing web performance in 2024.",
					primaryBadgeText: "Performance",
					secondaryBadgeText: "Guide",
					href: "https://example.com/performance-tips",
				},
			],
			totalCount: 100,
		},
		deleteAction: async () => ({
			success: true,
			message: "articles deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		initialData: {
			data: [
				{
					id: "1",
					key: "tech-articles-1",
					title: "New TypeScript Features Released",
					description:
						"TypeScript 5.3 brings exciting new features including better type inference and performance improvements.",
					primaryBadgeText: "Technology",
					secondaryBadgeText: "Featured",
					href: "https://example.com/typescript-article",
				},
				{
					id: "2",
					key: "tech-articles-2",
					title: "React 18 Best Practices",
					description:
						"Learn about the latest best practices for React 18 including concurrent features and Suspense.",
					primaryBadgeText: "React",
					href: "https://example.com/react-article",
				},
				{
					id: "3",
					key: "tech-articles-3",
					title: "Web Performance Optimization Tips",
					description: "Essential tips for optimizing web performance in 2024.",
					primaryBadgeText: "Performance",
					secondaryBadgeText: "Guide",
					href: "https://example.com/performance-tips",
				},
			],
			totalCount: 100,
		},
		deleteAction: undefined,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		initialData: {
			data: [],
			totalCount: 100,
		},
		deleteAction: async () => ({
			success: true,
			message: "article deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const SingleItem: Story = {
	args: {
		initialData: {
			data: [
				{
					id: "1",
					key: "tech-articles-1",
					title: "New TypeScript Features Released",
					description:
						"TypeScript 5.3 brings exciting new features including better type inference and performance improvements.",
					primaryBadgeText: "Technology",
					secondaryBadgeText: "Featured",
					href: "https://example.com/typescript-article",
				},
			],
			totalCount: 100,
		},
		deleteAction: async () => ({
			success: true,
			message: "article deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithInfiniteScroll: Story = {
	args: {
		initialData: {
			data: Array.from({ length: 100 }, (_, i) => ({
				id: String(i + 1),
				key: `tech-articles-${i + 1}`,
				title: `Sample Article ${i + 1}`,
				description: `This is the description for article number ${i + 1}.`,
				primaryBadgeText: "Technology",
				secondaryBadgeText: "Featured",
				href: `https://example.com/article-${i + 1}`,
			})),
			totalCount: 100,
		},
		deleteAction: async () => ({
			success: true,
			message: "article deleted successfully",
		}),
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: [
					{
						id: "4",
						key: `loaded-article-4-${Date.now()}`,
						title: "Loaded article",
						description: "This was loaded via infinite scroll",
						primaryBadgeText: "Loaded",
						href: "https://example.com/loaded-articles",
					},
				],
				totalCount: 100,
			},
		}),
	},
};
