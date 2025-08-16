import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { NewsStack } from "./news-stack";

type LinkCardData = {
	id: string;
	key: string;
	title: string;
	description?: string;
	primaryBadgeText?: string;
	secondaryBadgeText?: string;
	href: string;
};

type NewsStackWrapperProps = {
	currentPage: number;
	getNews: (page: number) => Promise<LinkCardData[]>;
	deleteNews?: (id: string) => Promise<{ success: boolean; message: string }>;
};

function NewsStackWrapper({
	currentPage,
	getNews,
	deleteNews,
}: NewsStackWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<NewsStack
				currentPage={currentPage}
				deleteNews={deleteNews}
				getNews={getNews}
			/>
		</Suspense>
	);
}

const meta = {
	component: NewsStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getNews: { action: "getNews" },
		deleteNews: { action: "deleteNews" },
	},
} satisfies Meta<typeof NewsStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNewsData: LinkCardData[] = [
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
];

export const Default: Story = {
	args: {
		currentPage: 1,
		getNews: async () => mockNewsData,
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		currentPage: 1,
		getNews: async () => mockNewsData,
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getNews: async () => [],
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
	},
};

export const SingleItem: Story = {
	args: {
		currentPage: 1,
		getNews: async () => [mockNewsData[0]],
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
	},
};

export const MinimalData: Story = {
	args: {
		currentPage: 1,
		getNews: async () => [
			{
				id: "1",
				key: "simple-news",
				title: "Simple News Item",
				href: "https://example.com/simple",
			},
		],
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 2,
		getNews: async (page) => {
			if (page === 2) {
				return [
					{
						id: "4",
						key: "page-2-news",
						title: "Page 2 News Item",
						description: "This is news from page 2",
						primaryBadgeText: "Page 2",
						href: "https://example.com/page-2-news",
					},
				];
			}
			return mockNewsData;
		},
		deleteNews: async () => ({
			success: true,
			message: "News deleted successfully",
		}),
	},
};

export const DeleteError: Story = {
	args: {
		currentPage: 1,
		getNews: async () => mockNewsData,
		deleteNews: async () => ({
			success: false,
			message: "Failed to delete news",
		}),
	},
};
