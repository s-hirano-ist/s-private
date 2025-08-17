import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { BooksStack, type Props as BooksStackProps } from "./books-stack";

function BooksStackWrapper({
	getBooks,
	deleteBooks,
	loadMoreAction,
}: BooksStackProps) {
	return (
		<Suspense>
			<BooksStack
				deleteBooks={deleteBooks}
				getBooks={getBooks}
				loadMoreAction={loadMoreAction}
			/>
		</Suspense>
	);
}

const meta = {
	component: BooksStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		getBooks: { action: "getBooks" },
		deleteBooks: { action: "deleteBooks" },
	},
} satisfies Meta<typeof BooksStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGetBooks = async () => ({
	data: [
		{
			id: "1",
			href: "/book/isbn-123",
			title: "TypeScript Handbook",
			image:
				"https://via.placeholder.com/150x200/0066cc/ffffff?text=TypeScript",
		},
		{
			id: "2",
			href: "/book/isbn-456",
			title: "React Design Patterns",
			image: "https://via.placeholder.com/150x200/61dafb/000000?text=React",
		},
		{
			id: "3",
			href: "/book/isbn-789",
			title: "Next.js in Action",
			image: "https://via.placeholder.com/150x200/000000/ffffff?text=Next.js",
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
		getBooks: mockGetBooks,
		loadMoreAction: mockLoadMoreAction,
		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		getBooks: mockGetBooks,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		getBooks: mockGetBooks,
		loadMoreAction: mockLoadMoreAction,

		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const SingleBook: Story = {
	args: {
		getBooks: mockGetBooks,
		loadMoreAction: mockLoadMoreAction,

		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};
