import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ContentsStack } from "./contents-stack";

type LinkCardData = {
	id: string;
	key: string;
	title: string;
	description?: string;
	primaryBadgeText?: string;
	secondaryBadgeText?: string;
	href: string;
};

type ContentsStackWrapperProps = {
	currentPage: number;
	getContents: (page: number) => Promise<LinkCardData[]>;
	deleteContents?: (
		id: string,
	) => Promise<{ success: boolean; message: string }>;
};

function ContentsStackWrapper({
	currentPage,
	getContents,
	deleteContents,
}: ContentsStackWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ContentsStack
				currentPage={currentPage}
				deleteContents={deleteContents}
				getContents={getContents}
			/>
		</Suspense>
	);
}

const meta = {
	component: ContentsStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getContents: { action: "getContents" },
		deleteContents: { action: "deleteContents" },
	},
} satisfies Meta<typeof ContentsStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockContentsData: LinkCardData[] = [
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
];

export const Default: Story = {
	args: {
		currentPage: 1,
		getContents: async () => mockContentsData,
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		currentPage: 1,
		getContents: async () => mockContentsData,
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getContents: async () => [],
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
	},
};

export const SingleItem: Story = {
	args: {
		currentPage: 1,
		getContents: async () => [mockContentsData[0]],
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
	},
};

export const MinimalData: Story = {
	args: {
		currentPage: 1,
		getContents: async () => [
			{
				id: "1",
				key: "simple-content",
				title: "Simple Content Item",
				href: "/content/simple",
			},
		],
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 2,
		getContents: async (page) => {
			if (page === 2) {
				return [
					{
						id: "5",
						key: "page-2-content",
						title: "Page 2 Content Item",
						description: "This is content from page 2",
						primaryBadgeText: "Page 2",
						href: "/content/page-2-item",
					},
				];
			}
			return mockContentsData;
		},
		deleteContents: async () => ({
			success: true,
			message: "Content deleted successfully",
		}),
	},
};

export const DeleteError: Story = {
	args: {
		currentPage: 1,
		getContents: async () => mockContentsData,
		deleteContents: async () => ({
			success: false,
			message: "Failed to delete content",
		}),
	},
};
