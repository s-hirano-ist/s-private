import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { BooksStack } from "./books-stack";

type BooksStackWrapperProps = {
	getBooks: () => Promise<
		Array<{
			id: string;
			href: string;
			title: string;
			image: string;
		}>
	>;
	deleteBooks?: (id: string) => Promise<{ success: boolean; message: string }>;
};

function BooksStackWrapper({ getBooks, deleteBooks }: BooksStackWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<BooksStack deleteBooks={deleteBooks} getBooks={getBooks} />
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

const mockBooks = [
	{
		id: "1",
		href: "/book/isbn-123",
		title: "TypeScript Handbook",
		image: "https://via.placeholder.com/150x200/0066cc/ffffff?text=TypeScript",
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
];

export const Default: Story = {
	args: {
		getBooks: async () => mockBooks,
		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		getBooks: async () => mockBooks,
	},
};

export const Empty: Story = {
	args: {
		getBooks: async () => [],
		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const SingleBook: Story = {
	args: {
		getBooks: async () => [mockBooks[0]],
		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const ManyBooks: Story = {
	args: {
		getBooks: async () => [
			...mockBooks,
			{
				id: "4",
				href: "/book/isbn-101",
				title: "JavaScript: The Good Parts",
				image:
					"https://via.placeholder.com/150x200/f7df1e/000000?text=JavaScript",
			},
			{
				id: "5",
				href: "/book/isbn-102",
				title: "Clean Code",
				image:
					"https://via.placeholder.com/150x200/2f4f4f/ffffff?text=Clean+Code",
			},
			{
				id: "6",
				href: "/book/isbn-103",
				title: "Design Patterns",
				image:
					"https://via.placeholder.com/150x200/8b0000/ffffff?text=Patterns",
			},
		],
		deleteBooks: async () => ({
			success: true,
			message: "Book deleted successfully",
		}),
	},
};

export const DeleteError: Story = {
	args: {
		getBooks: async () => mockBooks,
		deleteBooks: async () => ({
			success: false,
			message: "Failed to delete book",
		}),
	},
};
