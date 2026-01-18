import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BooksStack, type Props as BooksStackProps } from "./books-stack";

function BooksStackWrapper({
	initialData,
	deleteAction,
	loadMoreAction,
}: BooksStackProps) {
	return (
		<BooksStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}

const meta = {
	component: BooksStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		deleteAction: { action: "deleteAction" },
	},
} satisfies Meta<typeof BooksStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockInitialData = {
	data: [
		{
			id: "1",
			href: "/book/isbn-123",
			title: "TypeScript Handbook",
			image: "https://picsum.photos/id/1/192/192",
		},
		{
			id: "2",
			href: "/book/isbn-456",
			title: "React Design Patterns",
			image: "https://picsum.photos/id/2/192/192",
		},
		{
			id: "3",
			href: "/book/isbn-789",
			title: "Next.js in Action",
			image: "https://picsum.photos/id/3/192/192",
		},
	],
	totalCount: 100,
};

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
		initialData: mockInitialData,
		loadMoreAction: mockLoadMoreAction,
		deleteAction: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		initialData: mockInitialData,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		initialData: {
			data: [],
			totalCount: 0,
		},
		loadMoreAction: mockLoadMoreAction,
		deleteAction: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const SingleBook: Story = {
	args: {
		initialData: {
			data: [
				{
					id: "1",
					href: "/book/isbn-123",
					title: "TypeScript Handbook",
					image: "https://picsum.photos/id/1/192/192",
				},
			],
			totalCount: 1,
		},
		loadMoreAction: mockLoadMoreAction,
		deleteAction: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};
