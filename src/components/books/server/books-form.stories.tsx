import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { BooksForm } from "./books-form";

type BooksFormWrapperProps = {
	addBooks: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
};

function BooksFormWrapper({ addBooks }: BooksFormWrapperProps) {
	return (
		<Suspense>
			<BooksForm addBooks={addBooks} />
		</Suspense>
	);
}

const meta = {
	component: BooksFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addBooks: { action: "addBooks" },
	},
} satisfies Meta<typeof BooksFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addBooks: async () => ({
			success: true,
			message: "Books added successfully",
		}),
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addBooks: async () => ({
			success: false,
			message: "Failed to add books",
		}),
	},
};
