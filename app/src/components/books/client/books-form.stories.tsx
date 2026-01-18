import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BooksForm } from "./books-form";

const meta = {
	component: BooksForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addBooks: { action: "addBooks" },
	},
} satisfies Meta<typeof BooksForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addBooks: async () => ({
			success: true,
			message: "Book added successfully!",
		}),
	},
};

export const WithError: Story = {
	args: {
		addBooks: async () => {
			throw new Error("Failed to add book");
		},
	},
};
